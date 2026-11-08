#include <stdio.h>
int rsum(int n) {
	if(n == 1)
		return (n-1)*n;
	else
		return (n-1)*n + rsum(n-1);
}

int main(void) {
	printf("%d\n",rsum(4));
	return 0;
} 
