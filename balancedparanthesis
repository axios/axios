// C++ program to check for balanced brackets.

#include <bits/stdc++.h>
using namespace std;

// Function to check if brackets are balanced
bool areBracketsBalanced(string expr)
{
	// Declare a stack to hold the previous brackets.
	stack<char> temp;
	for (int i = 0; i < expr.length(); i++) {
		if (temp.empty()) {
			
			// If the stack is empty
			// just push the current bracket
			temp.push(expr[i]);
		}
		else if ((temp.top() == '(' && expr[i] == ')')
				|| (temp.top() == '{' && expr[i] == '}')
				|| (temp.top() == '[' && expr[i] == ']')) {
			
			// If we found any complete pair of bracket
			// then pop
			temp.pop();
		}
		else {
			temp.push(expr[i]);
		}
	}
	if (temp.empty()) {
		
		// If stack is empty return true
		return true;
	}
	return false;
}

// Driver code
int main()
{
	string expr = "{()}[]";

	// Function call
	if (areBracketsBalanced(expr))
		cout << "Balanced";
	else
		cout << "Not Balanced";
	return 0;
}
