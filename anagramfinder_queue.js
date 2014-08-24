var request = require('request');
var Combinatorics = require('js-combinatorics').Combinatorics;
var SetCollection = require('collections/set');
var md5 = require('MD5');
var Dequeue = require('dequeue');

// Constants
var ANAGRAM_OF_SECRET_PHRASE = 'poultry outwits ants';
var MD5_VALUE_OF_SECRET_PHRASE = '4624d200580677270a54ccff86b9610e';
var MAX_SEARCH_DEPTH = 3;

/*
* The 'main' function of the solution.
* 
* It fetches the wordlist and finds the secret phrase 
*/
request.get('http://followthewhiterabbit.trustpilot.com/cs/wordlist', function handleWordList(error, response, body) {
    if (!error && response.statusCode === 200) {
        findSecretPhrase(body);
    } else {
    	console.log('The wordlist could not be fetched');
    }
});


/**
 * Finds the secret phrase from a list of words
 * @param  {String} wordlist List of words
 */
function findSecretPhrase(wordlist) {

	// Log the start time
	var start = new Date().getTime();

	//Step 1: Convert the wordlist into an array of words
	var wordArray = wordlistIntoWordArray(wordlist);

	//Step 2: Optimize wordlist (remove unusable words)
	var optimizedWordArray = optimizeWordArray(wordArray);
	
	//Step 3: Find the secret phrase
	var secretPhrase = extractSecretPhrase(optimizedWordArray);

	// Measure the time taken to find the secret phrase
	var end = new Date().getTime();
	var time = (end - start) / 1000;
	
	//Output the result
	console.log('----------- RESULT -----------');
	if(secretPhrase) {
		console.log('Found secret phrase: %s - In %s seconds.', secretPhrase, time);
	} else {
		console.log('Could not find the secret phrase :-(');
	}
}

/**
 * Converts a wordlist into an array of words
 * @param  {String} wordlist List of words
 * @return {Array}          Array of words (strings)
 */
function wordlistIntoWordArray(wordlist) {
	console.log('----------- STEP 1: Convert wordlist to array of words -----------');
	//Some of the words have carriage returns -> remove those
	wordlist = wordlist.replace(/\r/gm,'');

	//Convert the wordlist into an array
	var wordArray = wordlist.split('\n');

	return wordArray;
}

/**
 * Applies optimization to reduce the number of words in the word array
 * @param  {Array} wordArray Array of words (strings)
 * @return {Array}           Array of words (optimized)
 */
function optimizeWordArray(wordArray) {
	console.log('----------- STEP 2: Optimize wordlist -----------');
	console.log('Words before optimization: %s', wordArray.length);

	//Calclate histogram for the anagram letters (how many times is each character represented)
	var anagramLetterHistogram = getCharacterHistogram(ANAGRAM_OF_SECRET_PHRASE.replace(/\s+/g, ''));

	//Check each word in the wordlist to see if it is usable
	var optimizedSet = new SetCollection();
	
	wordArray.forEach(function (element) {
		var wordHistogram = getCharacterHistogram(element);
		if(isWordSubsetOfHistogram(wordHistogram, anagramLetterHistogram) && element !== ''){
			optimizedSet.add(element);
		}
	});

	console.log('Words after optimization: %s', optimizedSet.length);
	return optimizedSet.toArray();
}

/**
 * Extracts the secret phrase form the array of words using a recursive backtracking algorithm
 * 
 * Note: The algorithm is implemented in an iterative-way using a LIFO queue that simulates recursion,
 * This is done as Node.js has issues with deep recursion trees
 * 
 * @param  {Array} wordlistArray Array of words
 * @return {String}              The secret phrase (if found)
 */
function extractSecretPhrase(wordlistArray) {
	console.log('----------- STEP 3: Find secret phrase -----------');

	//Calclate histogram for the anagram letters (how many times is each character represented)
	var anagramLetterHistogram = getCharacterHistogram(ANAGRAM_OF_SECRET_PHRASE.replace(/\s+/g, ''));

	//Sort words by length
	wordlistArray.sort(function(a, b){
	  return b.length - a.length;
	});

	// Find the relevant combinations by doing a depth-first iterative search 
	// (one could have used recursion, however the stack limit of node.js gets into the way)
	// 
	// The algorithm goes to a maximum depth - The correct value of the depth is found by experimenting (increase with one until the answer is found).


	// Create a queue for containing the words which needs to be investigated
	var queue = new Dequeue();

	// Add all the words from the wordlist to the queue to start with
	for(var i = 0; i < wordlistArray.length; i++) {
		queue.push([wordlistArray[i]]);
	}

	// As long as there are elements on the queue, the processing continues
	while(queue.length > 0) {
		// Pop the first element of the queue to investigate
		var wordArray = queue.shift();

		// Convert the current array of words into a string and to a character histogram
		var word = wordArray.join('');
		var wordHistogram = getCharacterHistogram(word);

		// Check if the histogram of the current word is a subset of the anagram character histogram,
		// if not the path should not be investigated.
		if(isWordSubsetOfHistogram(wordHistogram, anagramLetterHistogram) && word.length <= 18) {
			// Check if the histogram of the current word and the anagram are equal.
			// If true the current word is an anagram of the secret phrase anagram, 
			// otherwise the current word is still only a subset of the anagram.
			if(word.length === 18 && areHistogramsEqual(wordHistogram, anagramLetterHistogram)) {

				//console.log('Anagram found: %s - Queue length: %s',wordArray, queue.length);

				var secret = getSecretPhrase(wordArray);
				if(secret){
					return secret;
				}						
			} else {
				// Go deeper by adding each word in the wordlist to the current word/sentence
				// If the search has reached a certain depth, it stops
				if(wordArray.length < MAX_SEARCH_DEPTH) {
					for(var j = 0; j < wordlistArray.length; j++) {
						//Make a new copy of the current word array, and append the new word to it
						var arrayCopy = wordArray.slice(0);	
						arrayCopy.push(wordlistArray[j]);

						// Add the new word array to front of the queue.
						queue.unshift(arrayCopy);
					}	
				}
			}
		}
	}
}

/**
 * Returns the secret phrase if it is a combination of words int the supplied word array
 *
 * All permutations of the supplied anagram is tested against the md5-sum of the secret phrase
 * 
 * @param  {Array} anagram  Array of words
 * @return {String}         The secret phrase if found, otherwise nothing is returned
 */
function getSecretPhrase(anagram) {

	// Get all permutations of the supplied word
	var permutations = Combinatorics.permutation(anagram).toArray();

	// Check each of the permutations against the md5-value
	for(var i = 0; i<permutations.length; i++) {
		var anagramWord = permutations[i].join(' ');
		var md5Sum = md5(anagramWord);
		if(md5Sum === MD5_VALUE_OF_SECRET_PHRASE) {
			return anagramWord; 
		}
	}
}

/**
 * Checks if a word is a subset of another word by comparing the character histogram of the words.
 *
 * If the word contains characters not in the anagram, or more occurences of a specific character than the anagram,
 * it is not a subset.
 * 
 * @param  {String}  word             Word/Sentence which is compared to the anagram
 * @param  {Map}  histogram      	  Character histogram
 * @return {Boolean}                  True if the supplied word/sentence is a subset of the anagram
 */
function isWordSubsetOfHistogram(wordHistogram, histogram) {

	//Returns false if:
	// 1. the word contains letters not in the anagram, 
	// 2. More appearances of a letter in the word than in the anagram
	for(var letter in wordHistogram) {
		if(wordHistogram.hasOwnProperty(letter)) {
			if(!histogram.hasOwnProperty(letter) || wordHistogram[letter] > histogram[letter])
			{
				return false;
			}
		}
	}
	return true;
}

/**
 * Determines if a word is an anagram of another word by comparing the character histogram of the two words
 *
 * Only if the words contains exactly the same number of different characters, they are anagrams of each other.
 * 
 * @param  {Map}  histogram1	Character histogram
 * @param  {Map}  histogram2 	Character histogram
 * @return {Boolean}           	True if the two histgrams are equal
 */	
function areHistogramsEqual(histogram1, histogram2) {
	//var wordHistogram = getCharacterHistogram(word);

	// Compare the histograms
	for(var letter in histogram2) {
		if(histogram2.hasOwnProperty(letter)) {
			if(!histogram1.hasOwnProperty(letter) || (histogram2[letter] != histogram1[letter]))
			{
				return false;		
			}
		}
	}
	return true;
}

/**
 * Converts a string into a histogram of letters (map of characters and the number of occurences in the string)
 *
 * e.g. abac -> {a: 2, b: 1, c: 1}
 * 
 * @param  {String} word   A word/sentence for which the histogram is generated
 * @return {Map}           Character array of the word/sentence
 */
function getCharacterHistogram(word) {
	var histogram = {};
	var characterArray = word.split('');

	for(var i = 0; i<characterArray.length; i++) {
		if(histogram.hasOwnProperty(characterArray[i])) {
			histogram[characterArray[i]] = histogram[characterArray[i]] + 1;
		} else {
			histogram[characterArray[i]] = 1;
		}
	}

	return histogram;
}
