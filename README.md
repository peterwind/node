Anagram solver - Node.js
====

Possible solution for the Trustpilot backend challenge.

The problem is described on http://followthewhiterabbit.trustpilot.com/cs/step3.html, and the challenge is basically to find a specific anagram for the sentence "poultry outwits ants" on the basis of a supplied list of words (~100k words).

## Running the anagram solver
To run the anagram solver you should have node.js and npm installed and configured on your PATH.

You first need to install the dependencies of the anagram solver using the command:

```
npm install
```

The anagram solver can then be run by issuing the following command:

```
node anagramfinder_recursive.js
```
or
```
node anagramfinder_queue.js
```

## Strategy / Thoughts

One could choose to use brute force, but that would mean checking all permutations of the words in the dictionary up to a certain length. That is a lot of permutations and it is not feasible to check all of them. 

Instead I have chosen to use the following procedure:

1. Optimize the word list
  1. Remove duplicates
  2. Remove all words which contains characters not in the supplied sentence, or have more occurrences of a character than in the supplied sentence
2. Extract the secret phrase from the optimized word list
  1. Depth first investigation of each combination, constantly comparing the current sentence with the supplied sentence. If the sentence is no longer (sub)anagram the supplied sentence, the path is abandoned (known as recursive backtracking). Sentences are compared to the supplied sentence by comparing their character histogram. This is a fast and efficient way of comparing anagrams in O(n) time.
  2. If the sentence is an anagram of the supplied sentence, the md5 value of all permutations of the sentence is comparared to the taget md5 sum. If a match is found, the secret phrase is returned.

By using the above method, the original word list was reduces to 1658 words. This is still a large number of words to calculate all permutations of, but with the above method of abandoning bad paths, the answer is collected rather quickly (2-3 minutes). 

I have made two implementations which are quite similar. Both uses the same recursive backtracking algorithm, but with a small difference:

1. **anagramfinder_recursive.js** - Uses recursion to investigate all combinations using a depth-first technique.
2. **anagramfinder_queue.js** - Simulates recursion using a LIFO queue.

Both of the solutions gets the correct result, but due to limitations in the number of concurrent recursive calls in node.js, I had to simulate the recursion using a LIFO queue. Both of the solutions uses a limit on the depth of the algorithm. The limit should be set to the number of words in the desired sentence, however this can not be known beforehand. I have found the limit to be 3, but only by raising the limit one by one until the solution was found.

One could find even better heuristics or optimizations to the algorithms, but as my current solutions finds the correct answer in a couple of minutes, i decided to stop :-). 