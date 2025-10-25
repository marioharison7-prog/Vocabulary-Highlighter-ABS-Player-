<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// JSON file to store words data
$file = "../data/definitions.json";

// Create the file if it doesn't exist
if (!file_exists($file)) { 
    file_put_contents($file, "{}"); 
}

// Load existing data
$dataStore = json_decode(file_get_contents($file), true);

// Determine request method
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Get POST data
    $data = json_decode(file_get_contents("php://input"), true);

    // Clean inputs (trim but do NOT htmlspecialchars)
    $word = strtolower(trim($data["word"] ?? ""));
    $definition = trim($data["definition"] ?? "");
    $color = trim($data["color"] ?? "");
    $time = trim($data["time"] ?? date("c"));

    // Skip if empty after trimming
    if (!$word) {
        echo json_encode(["status" => "error", "message" => "Word is empty"]);
        exit;
    }

    // Save or update the word
    $dataStore[$word] = [
        "definition" => $definition ?: ($dataStore[$word]["definition"] ?? ""),
        "color" => $color ?: ($dataStore[$word]["color"] ?? ""),
        "time" => $time
    ];

    // Save JSON with unescaped unicode and pretty print
    file_put_contents($file, json_encode($dataStore, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // Return response
    $response = [
        "status" => "saved",
        "word" => $word,
        "definition" => $definition,
        "color" => $color,
        "time" => $time
    ];

} else {
    // GET request → return word => definition only
    $result = [];
    foreach ($dataStore as $word => $info) {
        $result[$word] = $info["definition"] ?? "";
    }
    $response = $result;
}

// Return JSON response
echo json_encode($response);
