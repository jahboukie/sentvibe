// Safe test file for memory system
function calculateSum(a, b) {
    return a + b;
}

function greetUser(name) {
    return `Hello, ${name}! Welcome to SentVibe.`;
}

// Export functions
module.exports = {
    calculateSum,
    greetUser
};

console.log('Safe test file loaded successfully');
