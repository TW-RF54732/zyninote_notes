#include <stdio.h>
#include <math.h>
int main(void) {
	int x;
	double ans;
	int i;
	
	printf("­pºâf(x) = x - x^2/2 + x^3/3 - x^4/4 + x^5/5 - ... x^10/10\n");
	printf("½Ð¿é¤Jx = ");
	scanf("%d", &x);
	for(i = 1, ans = 0; i <= 10; i++) {
		if((i%2) == 1)
			ans += pow(x, i) / i;
		else
			ans -= pow(x, i) / i;
	}
	printf("f(%d) = %lf\n", x, ans);
	return 0;
} 
