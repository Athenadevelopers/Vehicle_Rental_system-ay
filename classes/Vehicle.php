<?php
require_once 'config/database.php';

class Vehicle {
    private $conn;
    private $table_name = "vehicles";

    public $id;
    public $category_id;
    public $make;
    public $model;
    public $year;
    public $license_plate;
    public $color;
    public $seats;
    public $fuel_type;
    public $transmission;
    public $daily_rate;
    public $status;
    public $image_url;
    public $features;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT v.*, c.name as category_name FROM " . $this->table_name . " v 
                  LEFT JOIN vehicle_categories c ON v.category_id = c.id 
                  ORDER BY v.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readAvailable() {
        $query = "SELECT v.*, c.name as category_name FROM " . $this->table_name . " v 
                  LEFT JOIN vehicle_categories c ON v.category_id = c.id 
                  WHERE v.status = 'available' 
                  ORDER BY v.daily_rate ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT v.*, c.name as category_name FROM " . $this->table_name . " v 
                  LEFT JOIN vehicle_categories c ON v.category_id = c.id 
                  WHERE v.id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->category_id = $row['category_id'];
            $this->make = $row['make'];
            $this->model = $row['model'];
            $this->year = $row['year'];
            $this->license_plate = $row['license_plate'];
            $this->color = $row['color'];
            $this->seats = $row['seats'];
            $this->fuel_type = $row['fuel_type'];
            $this->transmission = $row['transmission'];
            $this->daily_rate = $row['daily_rate'];
            $this->status = $row['status'];
            $this->image_url = $row['image_url'];
            $this->features = $row['features'];
            return true;
        }
        return false;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET 
                  category_id=:category_id, make=:make, model=:model, year=:year, 
                  license_plate=:license_plate, color=:color, seats=:seats, 
                  fuel_type=:fuel_type, transmission=:transmission, daily_rate=:daily_rate, 
                  status=:status, image_url=:image_url, features=:features";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":make", $this->make);
        $stmt->bindParam(":model", $this->model);
        $stmt->bindParam(":year", $this->year);
        $stmt->bindParam(":license_plate", $this->license_plate);
        $stmt->bindParam(":color", $this->color);
        $stmt->bindParam(":seats", $this->seats);
        $stmt->bindParam(":fuel_type", $this->fuel_type);
        $stmt->bindParam(":transmission", $this->transmission);
        $stmt->bindParam(":daily_rate", $this->daily_rate);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":features", $this->features);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " SET 
                  category_id=:category_id, make=:make, model=:model, year=:year, 
                  license_plate=:license_plate, color=:color, seats=:seats, 
                  fuel_type=:fuel_type, transmission=:transmission, daily_rate=:daily_rate, 
                  status=:status, image_url=:image_url, features=:features 
                  WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":make", $this->make);
        $stmt->bindParam(":model", $this->model);
        $stmt->bindParam(":year", $this->year);
        $stmt->bindParam(":license_plate", $this->license_plate);
        $stmt->bindParam(":color", $this->color);
        $stmt->bindParam(":seats", $this->seats);
        $stmt->bindParam(":fuel_type", $this->fuel_type);
        $stmt->bindParam(":transmission", $this->transmission);
        $stmt->bindParam(":daily_rate", $this->daily_rate);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":features", $this->features);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
