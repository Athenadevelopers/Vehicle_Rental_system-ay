<?php
require_once 'config/config.php';
require_once 'config/database.php';

// Get database instance
$database = Database::getInstance();
$db_info = $database->getDatabaseInfo();

echo "<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Database Setup & Test - VehicleRent Pro</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
        }
        .status-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .success { border-left: 4px solid #10b981; background: #ecfdf5; }
        .error { border-left: 4px solid #ef4444; background: #fef2f2; }
        .warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
        .info { border-left: 4px solid #3b82f6; background: #eff6ff; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            text-align: center;
            border: none;
            cursor: pointer;
        }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .config-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .config-table th, .config-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        .config-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .icon { margin-right: 8px; }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #3b82f6);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🚗 VehicleRent Pro</h1>
            <h2>Database Setup & Connection Test</h2>
        </div>";

// Test database connection
echo "<div class='status-card info'>
        <h3>📊 Database Configuration</h3>
        <table class='config-table'>
            <tr><th>Setting</th><th>Value</th></tr>
            <tr><td>Host</td><td>{$db_info['host']}</td></tr>
            <tr><td>Database</td><td>{$db_info['database']}</td></tr>
            <tr><td>Username</td><td>{$db_info['username']}</td></tr>
            <tr><td>Port</td><td>{$db_info['port']}</td></tr>
            <tr><td>Charset</td><td>{$db_info['charset']}</td></tr>
        </table>
      </div>";

// Test connection
echo "<div class='status-card'>";
try {
    $connection_test = $database->testConnection();
    if ($connection_test) {
        echo "<div class='success'>
                <h3>✅ Database Connection Successful!</h3>
                <p>Successfully connected to the database server.</p>
              </div>";
    } else {
        echo "<div class='error'>
                <h3>❌ Database Connection Failed</h3>
                <p>Could not connect to the database server.</p>
              </div>";
    }
} catch (Exception $e) {
    echo "<div class='error'>
            <h3>❌ Database Connection Error</h3>
            <p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>
          </div>";
}
echo "</div>";

// Check if database exists
echo "<div class='status-card'>";
$db_exists = $database->databaseExists();
if ($db_exists) {
    echo "<div class='success'>
            <h3>✅ Database Exists</h3>
            <p>Database '{$db_info['database']}' is available.</p>
          </div>";
} else {
    echo "<div class='warning'>
            <h3>⚠️ Database Not Found</h3>
            <p>Database '{$db_info['database']}' does not exist. You need to create it.</p>
          </div>";
}
echo "</div>";

// Check tables
echo "<div class='status-card'>";
if ($db_exists) {
    $table_status = $database->getTableStatus();
    $total_tables = count($table_status);
    $existing_tables = array_filter($table_status, function($table) { return $table['exists']; });
    $existing_count = count($existing_tables);
    
    $progress_percentage = $total_tables > 0 ? ($existing_count / $total_tables) * 100 : 0;
    
    echo "<h3>📋 Table Status</h3>
          <div class='progress-bar'>
            <div class='progress-fill' style='width: {$progress_percentage}%'></div>
          </div>
          <p>{$existing_count} of {$total_tables} tables exist ({$progress_percentage}%)</p>
          <table class='config-table'>
            <tr><th>Table</th><th>Status</th><th>Records</th><th>Description</th></tr>";
    
    foreach ($table_status as $table_name => $status) {
        $status_icon = $status['exists'] ? '✅' : '❌';
        $status_text = $status['exists'] ? 'Exists' : 'Missing';
        $record_count = $status['exists'] ? $status['count'] : '-';
        
        echo "<tr>
                <td><strong>{$table_name}</strong></td>
                <td>{$status_icon} {$status_text}</td>
                <td>{$record_count}</td>
                <td>{$status['description']}</td>
              </tr>";
    }
    echo "</table>";
    
    if ($existing_count == $total_tables) {
        echo "<div class='success'>
                <h4>🎉 All tables are present!</h4>
                <p>Your database is fully set up and ready to use.</p>
              </div>";
    } else {
        echo "<div class='warning'>
                <h4>⚠️ Some tables are missing</h4>
                <p>You need to run the database installer to create missing tables.</p>
              </div>";
    }
} else {
    echo "<div class='error'>
            <h3>❌ Cannot Check Tables</h3>
            <p>Database does not exist. Please create the database first.</p>
          </div>";
}
echo "</div>";

// Check for admin user
if ($db_exists && $database->tablesExist()) {
    echo "<div class='status-card'>";
    try {
        $conn = $database->getConnection();
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        $admin_count = $stmt->fetch()['count'];
        
        if ($admin_count > 0) {
            echo "<div class='success'>
                    <h3>👤 Admin User Found</h3>
                    <p>{$admin_count} admin user(s) exist in the system.</p>
                  </div>";
        } else {
            echo "<div class='warning'>
                    <h3>⚠️ No Admin User</h3>
                    <p>No admin users found. You may need to create one.</p>
                  </div>";
        }
    } catch (Exception $e) {
        echo "<div class='error'>
                <h3>❌ Error Checking Admin Users</h3>
                <p>Error: " . htmlspecialchars($e->getMessage()) . "</p>
              </div>";
    }
    echo "</div>";
}

// System Requirements Check
echo "<div class='status-card info'>
        <h3>🔧 System Requirements</h3>
        <table class='config-table'>
            <tr><th>Requirement</th><th>Status</th><th>Current</th></tr>";

$requirements = [
    'PHP Version' => [
        'required' => '7.4+',
        'current' => PHP_VERSION,
        'status' => version_compare(PHP_VERSION, '7.4.0', '>=')
    ],
    'PDO Extension' => [
        'required' => 'Enabled',
        'current' => extension_loaded('pdo') ? 'Enabled' : 'Disabled',
        'status' => extension_loaded('pdo')
    ],
    'PDO MySQL' => [
        'required' => 'Enabled',
        'current' => extension_loaded('pdo_mysql') ? 'Enabled' : 'Disabled',
        'status' => extension_loaded('pdo_mysql')
    ],
    'GD Extension' => [
        'required' => 'Enabled',
        'current' => extension_loaded('gd') ? 'Enabled' : 'Disabled',
        'status' => extension_loaded('gd')
    ],
    'File Uploads' => [
        'required' => 'Enabled',
        'current' => ini_get('file_uploads') ? 'Enabled' : 'Disabled',
        'status' => ini_get('file_uploads')
    ]
];

foreach ($requirements as $name => $req) {
    $status_icon = $req['status'] ? '✅' : '❌';
    echo "<tr>
            <td>{$name}</td>
            <td>{$status_icon} {$req['current']}</td>
            <td>{$req['required']}</td>
          </tr>";
}

echo "</table></div>";

// Action Buttons
echo "<div style='text-align: center; margin-top: 30px;'>";

if (!$db_exists || !$database->tablesExist()) {
    echo "<a href='install.php' class='btn btn-primary'>🚀 Install Database</a>";
}

if ($db_exists && $database->tablesExist()) {
    echo "<a href='index.php' class='btn btn-success'>🏠 Go to Home Page</a>
          <a href='login.php' class='btn btn-primary'>🔐 Login</a>";
}

echo "<a href='setup.php' class='btn btn-warning'>🔄 Refresh Test</a>";

echo "</div>";

// Footer
echo "<div style='text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6b7280;'>
        <p>VehicleRent Pro - Professional Vehicle Rental Management System</p>
        <p>For support, please check the documentation or contact your system administrator.</p>
      </div>";

echo "</div></body></html>";
?>
