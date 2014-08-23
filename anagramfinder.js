var request = require('request');
var Combinatorics = require('js-combinatorics').Combinatorics;
var SetCollection = require("collections/set");
var md5 = require('MD5');


// Constants
var ANAGRAM_OF_SECRET_PHRASE = 'poultry outwits ants';
var MD5_VALUE_OF_SECRET_PHRASE = '4624d200580677270a54ccff86b9610e';

/*
* The 'main' function of the solution.
* 
* It fetches the wordlist and finds the secret phrase 
*/
request.get('http://followthewhiterabbit.trustpilot.com/cs/wordlist', function handleWordList(error, response, body) {
    if (!error && response.statusCode == 200) {
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

	//Step 1: Convert the wordlist into an array of words
	var wordArray = wordlistIntoWordArray(wordlist);

	//Step 2: Optimize wordlist (remove unusable words)
	var optimizedWordArray = optimizeWordArray(wordArray);
	
	//Step 3: Find the secret phrase
	var secretPhrase = findSecretAnagram(optimizedWordArray);
	
	//Output the result
	console.log('----------- RESULT -----------');
	if(secretPhrase) {
		console.log('Found secret phrase: %s', secretPhrase);
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
		if(isWordSubsetOfHistogram(element, anagramLetterHistogram)){
			optimizedSet.add(element);
		}
	});

	console.log('Words after optimization: %s', optimizedSet.length);
	return optimizedSet.toArray();
}


function findSecretAnagram(wordArray) {
	console.log('----------- STEP 3: Find secret phrase -----------');

	//Calclate histogram for the anagram letters (how many times is each character represented)
	var anagramLetterHistogram = getCharacterHistogram(ANAGRAM_OF_SECRET_PHRASE.replace(/\s+/g, ''));

	//Sort words by length
	wordArray.sort(function(a, b){
	  return b.length - a.length;
	});

	// Find the possible combinations of three word using "intelligent" rules
	for(var x = 0; x < wordArray.length; x++) {
		if(isWordSubsetOfHistogram(wordArray[x], anagramLetterHistogram)) {
			for(var y = 0; y < wordArray.length; y++) {
				if(isWordSubsetOfHistogram(wordArray[x] + wordArray[y], anagramLetterHistogram)) {
					for(var z = 0; z < wordArray.length; z++) {

						var wordHistogram = getCharacterHistogram(wordArray[x] + wordArray[y] + wordArray[z]);

						// Check if the histograms of the current combination and the supplied secret phrase anagram are equal
						// If they are, they are anagrams of each other
						if(areHistogramsEqual(wordHistogram, anagramLetterHistogram)) {
							
							var anagram = [wordArray[x], wordArray[y], wordArray[z]];

							var secret = getSecretPhrase(anagram);
							if(secret){
								return secret;
							}
						}
					}
				}
			}
		}
		console.log('Progres: %s / %s - Word done: %s', x+1, wordArray.length, wordArray[x]);

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
		if(md5Sum == MD5_VALUE_OF_SECRET_PHRASE) {
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
function isWordSubsetOfHistogram(word, histogram) {
	var wordHistogram = getCharacterHistogram(word);

	//Returns false if:
	// 1. the word contains letters not in the anagram, 
	// 2. More appearances of a letter in the word than in the anagram
	for(var letter in wordHistogram) {
		if(wordHistogram.hasOwnProperty(letter)) {
			if(!anagramHistogram.hasOwnProperty(letter) || wordHistogram[letter] > anagramHistogram[letter])
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
