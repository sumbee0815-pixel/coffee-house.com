<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_POST['email']) || !isset($_POST['password'])) {
    echo json_encode(["status" => "error", "message" => "Мэдээлэл дутуу байна!"]);
    exit();
}

$conn = new mysqli('localhost', 'root', '', 'coffee_shop');

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Баазтай холбогдож чадсангүй."]));
}

$email = $_POST['email'];
$pass = $_POST['password'];

$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    if (password_verify($pass, $row['password'])) {
        echo json_encode([
            "status" => "success", 
            "message" => "Амжилттай нэвтэрлээ!",
            "user" => [
                "id" => $row['id'],
                "username" => $row['username'],
                "email" => $email
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Нууц үг буруу байна!"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "И-мэйл бүртгэлгүй байна!"]);
}

$stmt->close();
$conn->close();
?>