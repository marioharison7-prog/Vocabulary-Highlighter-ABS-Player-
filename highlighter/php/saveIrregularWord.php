<?php
// === Headers ===
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// === JSON file path ===
$jsonFile = "../data/irregularWords.json";

// === Read input ===
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['originalWord']) || !isset($input['lemma'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// === Clean inputs ===
// Keep symbols, apostrophes, accented letters, etc.
$originalWord = trim($input['originalWord']);
$lemma = trim($input['lemma']);

if (!$originalWord || !$lemma) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid word or lemma']);
    exit;
}

// === Load existing data safely ===
if (!file_exists($jsonFile)) file_put_contents($jsonFile, '{}');

$irregularWords = json_decode(file_get_contents($jsonFile), true);
if (!is_array($irregularWords)) $irregularWords = [];

// === Add/update the word ===
$irregularWords[$originalWord] = $lemma;

// === Save back to JSON ===
if (file_put_contents($jsonFile, json_encode($irregularWords, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode([
        'success' => true,
        'originalWord' => $originalWord,
        'lemma' => $lemma,
        'message' => 'Word saved successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write file']);
}
 