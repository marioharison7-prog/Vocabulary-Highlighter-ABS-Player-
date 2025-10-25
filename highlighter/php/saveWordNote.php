<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    exit;
}

$file = "../data/wordNotes.json";

// Get input
$input = json_decode(file_get_contents('php://input'), true);
$word = $input['word'] ?? '';
$note = $input['note'] ?? '';

// Load existing notes
$notes = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];

// Update or remove note
if ($note) {
    $notes[$word] = $note;
} else {
    unset($notes[$word]);
}

// Save back to file
file_put_contents($file, json_encode($notes, JSON_PRETTY_PRINT));

echo json_encode(['success' => true, 'word' => $word, 'note' => $note]);
