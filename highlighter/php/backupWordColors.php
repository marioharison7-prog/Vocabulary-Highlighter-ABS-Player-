<?php
header('Content-Type: application/json');

// Allow requests from your extension or localhost (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Read the raw POST data
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Check if wordColors exists
if (isset($data['wordColors']) && is_array($data['wordColors'])) {
    $file = '../data/wordColors.json'; // Use $file consistently

    // Encode data to JSON
    $jsonData = json_encode($data['wordColors'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    // Save to file
    if (file_put_contents($file, $jsonData) !== false) {
        echo json_encode(["status" => "success", "message" => "wordColors saved."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to save file."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid input."]);
}
?>
 