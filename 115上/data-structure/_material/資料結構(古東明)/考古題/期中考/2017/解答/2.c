#include <stdio.h>
#include <stdlib.h>
#include <time.h>
int main(void) {
	int array_3x3[3][3];
	int sum;
	int i, j;
	
	//先給陣列個元素隨機亂數 
	srand(time(NULL));
	for(i = 0; i < 3; i++) {
		for(j = 0; j < 3; j++) {
			array_3x3[i][j] = rand() % 16 + 5;
		}
	}
	
	//印出陣列 
	for(i = 0; i < 3; i++) {
		for(j = 0; j < 3; j++) {
			printf("%3d", array_3x3[i][j]);
		}
		printf("\n");
	}
	
	//印出個直行的總和
	for(j = 0; j < 3; j++) {
		sum = 0;
		for(i = 0; i < 3; i++) {
			sum += array_3x3[i][j];
		}
		printf("第%d直行的總和為: %d\n", (j+1), sum);
	}
	
	//計算對角線陣列元素的總和
	sum = 0;
	for(i = 0; i < 3; i++) {
		sum += array_3x3[i][i];
	}
	printf("由左上至右下的對角線元素總和為: %d\n", sum);
	
	sum = 0;
	for(i = 0; i < 3; i++) {
		sum += array_3x3[i][2-i];
	}
	printf("由右上至左下的對角線元素總和為: %d\n", sum);
} 
