<?php
require_once 'config/database.php';

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password;
    public $full_name;
    public $phone;
    public $address;
    public $role;
    public $status;
    public $email_verified;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($username, $password) {
        $query = "SELECT id, username, email, password, full_name, role, status, email_verified 
                  FROM " . $this->table_name . " 
                  WHERE (username = ? OR email = ?) AND status = 'active'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $username);
        $stmt->bindParam(2, $username);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($password, $row['password'])) {
                $this->id = $row['id'];
                $this->username = $row['username'];
                $this->email = $row['email'];
                $this->full_name = $row['full_name'];
                $this->role = $row['role'];
                $this->status = $row['status'];
                $this->email_verified = $row['email_verified'];

                // Log successful login
                $database = Database::getInstance();
                $database->logActivity($this->id, 'user_login', 'user', $this->id, "User logged in: {$this->username}");

                // Update last login time (you can add this field if needed)
                $this->updateLastLogin();

                return true;
            }
        }
        return false;
    }

    public function register() {
        // Generate unique ID for the user
        $query = "INSERT INTO " . $this->table_name . " 
                  SET username=:username, email=:email, password=:password, 
                      full_name=:full_name, phone=:phone, address=:address, 
                      role='customer', status='active', email_verified=FALSE";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize and hash data
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->address = htmlspecialchars(strip_tags($this->address));

        // Bind parameters
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":address", $this->address);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            $this->role = 'customer';
            $this->status = 'active';
            $this->email_verified = false;
            return true;
        }
        return false;
    }

    public function emailExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function usernameExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->username);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function updateProfile() {
        $query = "UPDATE " . $this->table_name . " 
                  SET full_name=:full_name, phone=:phone, address=:address, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize data
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->address = htmlspecialchars(strip_tags($this->address));

        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            // Log profile update
            $database = Database::getInstance();
            $database->logActivity($this->id, 'profile_updated', 'user', $this->id, "Profile updated");
            return true;
        }
        return false;
    }

    public function changePassword($current_password, $new_password) {
        // First verify current password
        $query = "SELECT password FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($current_password, $row['password'])) {
                // Update password
                $update_query = "UPDATE " . $this->table_name . " 
                                SET password=:password, updated_at=CURRENT_TIMESTAMP 
                                WHERE id=:id";
                $update_stmt = $this->conn->prepare($update_query);
                $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                $update_stmt->bindParam(":password", $hashed_password);
                $update_stmt->bindParam(":id", $this->id);
                
                if($update_stmt->execute()) {
                    // Log password change
                    $database = Database::getInstance();
                    $database->logActivity($this->id, 'password_changed', 'user', $this->id, "Password changed");
                    return true;
                }
            }
        }
        return false;
    }

    public function readOne() {
        $query = "SELECT id, username, email, full_name, phone, address, role, status, email_verified, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = ? LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->username = $row['username'];
            $this->email = $row['email'];
            $this->full_name = $row['full_name'];
            $this->phone = $row['phone'];
            $this->address = $row['address'];
            $this->role = $row['role'];
            $this->status = $row['status'];
            $this->email_verified = $row['email_verified'];
            return true;
        }
        return false;
    }

    public function getCustomers($limit = null, $offset = 0, $search = '') {
        $where_clause = "WHERE role = 'customer'";
        $params = [];
        
        if (!empty($search)) {
            $where_clause .= " AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)";
            $search_term = '%' . $search . '%';
            $params = [$search_term, $search_term, $search_term];
        }
        
        $query = "SELECT id, username, email, full_name, phone, status, email_verified, created_at 
                  FROM " . $this->table_name . " 
                  $where_clause 
                  ORDER BY created_at DESC";
        
        if ($limit) {
            $query .= " LIMIT $limit OFFSET $offset";
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt;
    }

    public function getCustomerStats($customer_id) {
        $query = "SELECT 
                    COUNT(b.id) as total_bookings,
                    SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END) as total_spent,
                    SUM(CASE WHEN b.status = 'active' THEN 1 ELSE 0 END) as active_bookings,
                    MAX(b.booking_date) as last_booking_date
                  FROM users u
                  LEFT JOIN bookings b ON u.id = b.customer_id
                  WHERE u.id = ?
                  GROUP BY u.id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$customer_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($user_id, $status) {
        $query = "UPDATE " . $this->table_name . " 
                  SET status=:status, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $user_id);
        
        if($stmt->execute()) {
            // Log status change
            $database = Database::getInstance();
            $database->logActivity($_SESSION['user_id'] ?? null, 'user_status_changed', 'user', $user_id, "Status changed to: $status");
            return true;
        }
        return false;
    }

    public function verifyEmail($user_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET email_verified=TRUE, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $user_id);
        
        if($stmt->execute()) {
            // Log email verification
            $database = Database::getInstance();
            $database->logActivity($user_id, 'email_verified', 'user', $user_id, "Email verified");
            return true;
        }
        return false;
    }

    private function updateLastLogin() {
        // You can add a last_login field to the users table and update it here
        try {
            $query = "UPDATE " . $this->table_name . " 
                      SET updated_at=CURRENT_TIMESTAMP 
                      WHERE id=:id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $this->id);
            $stmt->execute();
        } catch (Exception $e) {
            // Log error but don't break login process
            error_log("Failed to update last login: " . $e->getMessage());
        }
    }

    public function delete($user_id) {
        // Soft delete - change status to inactive instead of actual deletion
        $query = "UPDATE " . $this->table_name . " 
                  SET status='inactive', updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $user_id);
        
        if($stmt->execute()) {
            // Log user deletion
            $database = Database::getInstance();
            $database->logActivity($_SESSION['user_id'] ?? null, 'user_deleted', 'user', $user_id, "User account deactivated");
            return true;
        }
        return false;
    }

    // Get user activity logs
    public function getActivityLogs($user_id, $limit = 50) {
        $query = "SELECT al.*, u.username, u.full_name 
                  FROM activity_logs al
                  LEFT JOIN users u ON al.user_id = u.id
                  WHERE al.user_id = ?
                  ORDER BY al.created_at DESC
                  LIMIT ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_id, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Check if user has permission for specific action
    public function hasPermission($action) {
        // Basic role-based permissions
        $permissions = [
            'admin' => ['*'], // Admin has all permissions
            'customer' => [
                'view_own_bookings',
                'create_booking',
                'cancel_own_booking',
                'update_own_profile',
                'view_vehicles'
            ]
        ];

        if ($this->role === 'admin') {
            return true; // Admin has all permissions
        }

        return in_array($action, $permissions[$this->role] ?? []);
    }

    // Get user dashboard stats
    public function getDashboardStats($user_id) {
        if ($this->role === 'customer') {
            return $this->getCustomerStats($user_id);
        } elseif ($this->role === 'admin') {
            return $this->getAdminStats();
        }
        return [];
    }

    private function getAdminStats() {
        $stats = [];
        
        // Total users
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
        $stats['total_customers'] = $stmt->fetch()['count'];
        
        // Active bookings
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'active'");
        $stats['active_bookings'] = $stmt->fetch()['count'];
        
        // Total revenue
        $stmt = $this->conn->query("SELECT SUM(total_amount) as total FROM bookings WHERE status IN ('completed', 'active')");
        $stats['total_revenue'] = $stmt->fetch()['total'] ?: 0;
        
        // Available vehicles
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'");
        $stats['available_vehicles'] = $stmt->fetch()['count'];
        
        return $stats;
    }
}
?>
