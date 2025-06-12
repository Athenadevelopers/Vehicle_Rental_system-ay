<?php
require_once 'config/database.php';

class Booking {
    private $conn;
    private $table_name = "bookings";

    public $id;
    public $customer_id;
    public $vehicle_id;
    public $start_date;
    public $end_date;
    public $pickup_location;
    public $return_location;
    public $total_days;
    public $daily_rate;
    public $total_amount;
    public $status;
    public $notes;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET 
                  customer_id=:customer_id, vehicle_id=:vehicle_id, start_date=:start_date, 
                  end_date=:end_date, pickup_location=:pickup_location, return_location=:return_location, 
                  total_days=:total_days, daily_rate=:daily_rate, total_amount=:total_amount, 
                  status=:status, notes=:notes";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":customer_id", $this->customer_id);
        $stmt->bindParam(":vehicle_id", $this->vehicle_id);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":end_date", $this->end_date);
        $stmt->bindParam(":pickup_location", $this->pickup_location);
        $stmt->bindParam(":return_location", $this->return_location);
        $stmt->bindParam(":total_days", $this->total_days);
        $stmt->bindParam(":daily_rate", $this->daily_rate);
        $stmt->bindParam(":total_amount", $this->total_amount);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":notes", $this->notes);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function read() {
        $query = "SELECT b.*, u.full_name as customer_name, u.email as customer_email, 
                         v.make, v.model, v.license_plate 
                  FROM " . $this->table_name . " b 
                  LEFT JOIN users u ON b.customer_id = u.id 
                  LEFT JOIN vehicles v ON b.vehicle_id = v.id 
                  ORDER BY b.booking_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readByCustomer($customer_id) {
        $query = "SELECT b.*, v.make, v.model, v.license_plate, v.image_url 
                  FROM " . $this->table_name . " b 
                  LEFT JOIN vehicles v ON b.vehicle_id = v.id 
                  WHERE b.customer_id = ? 
                  ORDER BY b.booking_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $customer_id);
        $stmt->execute();
        return $stmt;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " SET status=:status WHERE id=:id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }

    public function isVehicleAvailable($vehicle_id, $start_date, $end_date, $booking_id = null) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE vehicle_id = ? AND status IN ('confirmed', 'active') 
                  AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) 
                  OR (start_date >= ? AND end_date <= ?))";
        
        if($booking_id) {
            $query .= " AND id != ?";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $vehicle_id);
        $stmt->bindParam(2, $start_date);
        $stmt->bindParam(3, $start_date);
        $stmt->bindParam(4, $end_date);
        $stmt->bindParam(5, $end_date);
        $stmt->bindParam(6, $start_date);
        $stmt->bindParam(7, $end_date);
        
        if($booking_id) {
            $stmt->bindParam(8, $booking_id);
        }

        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] == 0;
    }
}
?>
