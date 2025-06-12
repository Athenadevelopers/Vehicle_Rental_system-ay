<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/config.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON data');
    }

    $database = Database::getInstance();
    $db = $database->getConnection();

    $firebase_uid = $input['firebase_uid'] ?? '';
    $email = $input['email'] ?? '';
    $full_name = $input['full_name'] ?? '';
    $phone = $input['phone'] ?? '';
    $address = $input['address'] ?? '';
    $photo_url = $input['photo_url'] ?? '';
    $provider = $input['provider'] ?? 'firebase';
    $email_verified = $input['email_verified'] ?? 0;

    if (empty($firebase_uid) || empty($email)) {
        throw new Exception('Firebase UID and email are required');
    }

    // Check if user already exists by Firebase UID
    $check_query = "SELECT id, username, role FROM users WHERE firebase_uid = ?";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([$firebase_uid]);
    $existing_user = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing_user) {
        // Update existing user
        $update_query = "UPDATE users SET 
                        email = ?, 
                        full_name = ?, 
                        phone = ?, 
                        address = ?, 
                        photo_url = ?, 
                        email_verified = ?, 
                        updated_at = CURRENT_TIMESTAMP 
                        WHERE firebase_uid = ?";
        
        $update_stmt = $db->prepare($update_query);
        $update_stmt->execute([
            $email, $full_name, $phone, $address, 
            $photo_url, $email_verified, $firebase_uid
        ]);

        $user_id = $existing_user['id'];
        $username = $existing_user['username'];
        $role = $existing_user['role'];
    } else {
        // Check if user exists by email (for linking existing accounts)
        $email_check_query = "SELECT id, username, role FROM users WHERE email = ?";
        $email_check_stmt = $db->prepare($email_check_query);
        $email_check_stmt->execute([$email]);
        $email_user = $email_check_stmt->fetch(PDO::FETCH_ASSOC);

        if ($email_user) {
            // Link existing account with Firebase
            $link_query = "UPDATE users SET 
                          firebase_uid = ?, 
                          full_name = COALESCE(NULLIF(full_name, ''), ?), 
                          phone = COALESCE(NULLIF(phone, ''), ?), 
                          address = COALESCE(NULLIF(address, ''), ?), 
                          photo_url = COALESCE(NULLIF(photo_url, ''), ?), 
                          email_verified = GREATEST(email_verified, ?), 
                          updated_at = CURRENT_TIMESTAMP 
                          WHERE email = ?";
            
            $link_stmt = $db->prepare($link_query);
            $link_stmt->execute([
                $firebase_uid, $full_name, $phone, $address, 
                $photo_url, $email_verified, $email
            ]);

            $user_id = $email_user['id'];
            $username = $email_user['username'];
            $role = $email_user['role'];
        } else {
            // Create new user
            $username = $this->generateUsernameFromEmail($email);
            
            $insert_query = "INSERT INTO users 
                           (firebase_uid, username, email, full_name, phone, address, 
                            photo_url, role, status, email_verified, auth_provider) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, 'customer', 'active', ?, ?)";
            
            $insert_stmt = $db->prepare($insert_query);
            $insert_stmt->execute([
                $firebase_uid, $username, $email, $full_name, $phone, 
                $address, $photo_url, $email_verified, $provider
            ]);

            $user_id = $db->lastInsertId();
            $role = 'customer';
        }
    }

    // Set PHP session
    session_start();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
    $_SESSION['full_name'] = $full_name;
    $_SESSION['role'] = $role;
    $_SESSION['firebase_uid'] = $firebase_uid;
    $_SESSION['auth_provider'] = $provider;

    // Log activity
    $database->logActivity($user_id, 'firebase_auth', 'user', $user_id, "User authenticated via Firebase ($provider)");

    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'username' => $username,
        'role' => $role,
        'message' => 'User synced successfully'
    ]);

} catch (Exception $e) {
    error_log("Firebase sync error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function generateUsernameFromEmail($email) {
    $username = explode('@', $email)[0];
    $username = preg_replace('/[^a-zA-Z0-9_]/', '', $username);
    
    // Add random number if username is too short
    if (strlen($username) < 3) {
        $username .= rand(100, 999);
    }
    
    return $username;
}
?>
