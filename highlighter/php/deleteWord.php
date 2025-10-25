<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// JSON file to store words data
$file = '../data/definitions.json';

// Create the file if it doesn't exist
if (!file_exists($file)) { 
    file_put_contents($file, "{}"); 
}

// Load existing data
$dataStore = json_decode(file_get_contents($file), true);

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);
$word = strtolower(trim($data["word"] ?? ""));

if ($word) {
    if (isset($dataStore[$word])) {
        unset($dataStore[$word]); // Delete the word
        file_put_contents($file, json_encode($dataStore, JSON_PRETTY_PRINT));
        $response = [
            "status" => "deleted",
            "word" => $word
        ];
    } else {
        $response = [
            "status" => "error",
            "message" => "Word not found"
        ];
    }
} else {
    $response = [
        "status" => "error",
        "message" => "No word provided"
    ];
}

// Return JSON response
echo json_encode($response);
