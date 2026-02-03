<?php
// Алдааг ил гаргах (Хөгжүүлэлтийн үед хэрэгтэй)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST"); // POST зөвшөөрөх
header("Content-Type: application/json; charset=UTF-8");

// Өгөгдөл ирсэн эсэхийг шалгах
if (!isset($_POST['username']) || !isset($_POST['email']) || !isset($_POST['password'])) {
    echo json_encode(["status" => "error", "message" => "Мэдээлэл дутуу байна! (JS талаас data ирэхгүй байна)"]);
    exit();
}

$conn = new mysqli('localhost', 'root', '', 'coffee_shop');

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Баазтай холбогдож чадсангүй: " . $conn->connect_error]));
}

$name = $_POST['username'];
$email = $_POST['email'];
$pass = $_POST['password'];

// 1. И-мэйл давхацсан эсэхийг шалгах
$stmt = $conn->prepare("SELECT email FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Энэ и-мэйл бүртгэлтэй байна!"]);
} else {
    // 2. Нууц үгийг шифрлэх
    $hashed_password = password_hash($pass, PASSWORD_DEFAULT);

    // 3. Бүртгэх
    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("sss", $name, $email, $hashed_password);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Амжилттай бүртгэгдлээ!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Хадгалахад алдаа гарлаа: " . $stmt->error]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "SQL алдаа: " . $conn->error]);
    }
}

$stmt->close();
$conn->close();
?>