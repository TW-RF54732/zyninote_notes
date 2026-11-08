#include <stdio.h>
int g(int n) {
	if(n == 1)
		return (n-1)*n;
	else
		return g(n-1) + (n-1)*n;
}
int main(void) {
	int n;
	printf("計算g(n) = 1*2 + 2*3 + 3*4 + ... + (n-1)*n\n");
	printf("請輸入n = ");
	scanf("%d", &n);
	if(n < 1) {
		printf("不能輸入小於1的數值\n");
		return 0;
	}
	printf("g(%d) = %d\n", n, g(n));
	return 0;
}
