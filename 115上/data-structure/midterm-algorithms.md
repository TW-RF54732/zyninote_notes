---
title: 期中考 演算法程式複習
summary: 把第 1–6 章出現的演算法集中起來，每個先列寫程式要用到的概念（變數意義、迴圈或遞迴、邊界條件、常見錯誤），再附可直接編譯執行的 C 程式（同時能用 C++ 編譯）：n! 與最大值、陣列位址與三角矩陣索引、循序與二元搜尋、氣泡排序、矩陣轉置加法乘法、稀疏矩陣三行式，單向串列的插入刪除反轉合併釋放、雙向與環狀串列、多項式相加，陣列與串列實作堆疊佇列、環狀佇列、多重堆疊、雙向佇列、優先佇列、中置轉後置與後置求值，遞迴的次方階乘費氏河內塔 GCD 排列，二元樹追蹤、陣列表示法、由前中序重建、引線二元樹、二元搜尋樹、AVL 旋轉、B 樹搜尋、互斥集合與霍夫曼編碼
order: 7
tags: []
---

## 怎麼用這份複習 {#how-to-use}

每個演算法一個區塊，結構都一樣：

- **想法**：一兩句話說它在做什麼。
- **寫程式要注意**：要用到的變數、迴圈或遞迴的寫法、邊界條件、最常寫錯的地方。考試寫程式題時，先把這幾點想清楚再下筆。
- **C 程式**（摺疊）：完整可編譯的程式，含 `main` 示範與預期輸出。寫法照課本（欄位名 `link`、`l_child`、`top = -1`…），而且**也能用 C++ 編譯**（`malloc` 都有轉型、沒有用 C++ 保留字當變數名）。

每個區塊最後有連結回原章節，概念細節和互動圖在那裡。

## C 與 C++ 寫法對照 {#c-vs-cpp}

課本用 C。如果考試或作業允許 C++，下列寫法可以互換，演算法本身完全一樣：

| 要做的事 | C | C++ |
|---|---|---|
| 要一個節點 | `p = (struct node *)malloc(sizeof(struct node));` | `p = new node;` |
| 歸還節點 | `free(p);` | `delete p;` |
| 宣告節點指標 | `struct node *p;` | `node *p;`（可省 `struct`） |
| 改呼叫端的指標 | 傳指標的指標 `struct node **front` | 傳參考 `node *&front` |
| 輸出 | `printf("%d", x);` | `cout << x;` |
| 交換 | 自己寫 `swap(int *a, int *b)` | `std::swap(a, b);` |
| 現成堆疊／佇列 | 自己寫 | `std::stack`、`std::queue`、`std::priority_queue` |

**注意**：課本有的程式用 `new` 當變數名稱（例如新節點），這在 C 可以，在 C++ 是保留字會編譯失敗。本頁一律改用 `x` 或 `node_new`。

## 迴圈基本功（第 1 章） {#loops}

### 用迴圈算 n! {#alg-factorial-loop}

**想法**：$n! = 1 \times 2 \times \cdots \times n$，用一個變數一路乘上去。

**寫程式要注意**：

- 累乘的初值是 **1**（累加才是 0），寫成 0 結果永遠是 0。
- 迴圈變數從 1 跑到 $n$（含 $n$），條件寫 `m <= n`。
- `int`（32 位元）只裝得下到 $12!$，$13!$ 就溢位；要更大用 `long long`。
- 時間 $O(n)$：迴圈跑 $n$ 次。

原章節：[[ch1-exercises#q-factorial-for|第 1 章習題：用 for 迴圈算 n!]]

#### C 程式 {#alg-factorial-loop-code .fold}

```c
#include <stdio.h>

long factorial_loop(int n) {
    long product = 1;                 /* 累乘從 1 開始 */
    for (int m = 1; m <= n; m++)
        product *= m;
    return product;
}

int main(void) {
    printf("5! = %ld\n", factorial_loop(5));    /* 5! = 120 */
    printf("0! = %ld\n", factorial_loop(0));    /* 0! = 1，迴圈一次都不跑 */
    return 0;
}
```

### 三數取最大值 {#alg-max-of-three}

**想法**：先假設第一個最大，再拿其他數一個個來挑戰，比它大就換掉。

**寫程式要注意**：

- 用一個變數 `max` 記「目前最大的」，初值設成第一個數（不要設 0，全部是負數時會錯）。
- 兩個**獨立**的 `if`，不是 `if … else if`：每個數都要比過。
- 同樣的寫法推廣到 $n$ 個數，就是一個 `for` 迴圈。

原章節：[[ch1-intro#ex-max-of-three|第 1 章：三數取最大值]]

#### C 程式 {#alg-max-of-three-code .fold}

```c
#include <stdio.h>

int max3(int a, int b, int c) {
    int max = a;                 /* 先假設 a 最大 */
    if (b > max) max = b;
    if (c > max) max = c;
    return max;
}

int max_n(const int d[], int n) {   /* 推廣到 n 個 */
    int max = d[0];
    for (int i = 1; i < n; i++)
        if (d[i] > max) max = d[i];
    return max;
}

int main(void) {
    int d[] = {-7, -3, -9};
    printf("%d\n", max3(3, 9, 5));        /* 9 */
    printf("%d\n", max_n(d, 3));          /* -3 */
    return 0;
}
```

## 陣列（第 2 章） {#arrays}

### 陣列位址計算 {#alg-address}

**想法**：所有位址公式都是「**起點 + 前面有幾個元素 × 每個元素的大小**」。

**寫程式要注意**：

- 一維 $A[f..t]$：前面有 $i-f$ 個 → $\alpha + (i-f)z$。
- 二維以列為主（C 語言）：前面有 $i$ 整列（每列 $n$ 個）再加同列左邊 $j$ 個 → $\alpha + (i\cdot n + j)z$。以行為主就是行列對調。
- 任意上下界：先把索引都減掉下界，變成從 0 開始再套公式。每列個數 $n = t_2 - f_2 + 1$（**要加 1**）。
- 三維 $C[l][m][n]$ 以列為主：$\alpha + (i\,mn + j\,n + k)z$。
- C 的二維陣列就是以列為主，可以用 `&a[i][j]` 的實際位址驗證公式（程式裡就是這樣檢查的）。

原章節：[[ch2-array#address-1d|一維陣列位址]]、[[ch2-array#address-2d-bounds|任意上下界的二維陣列]]、[[ch2-array#address-nd|三維與 n 維]]

#### C 程式 {#alg-address-code .fold}

```c
#include <stdio.h>

/* 一維 A[f..t] */
long loc1(long alpha, int z, int f, int i) {
    return alpha + (long)(i - f) * z;
}

/* 二維 A[f1..t1][f2..t2]，以列為主（RM） */
long loc2_rm(long alpha, int z, int f1, int f2, int t2, int i, int j) {
    int n = t2 - f2 + 1;                       /* 每列幾個元素 */
    return alpha + ((long)(i - f1) * n + (j - f2)) * z;
}

/* 二維 A[f1..t1][f2..t2]，以行為主（CM） */
long loc2_cm(long alpha, int z, int f1, int t1, int f2, int i, int j) {
    int m = t1 - f1 + 1;                       /* 每行幾個元素 */
    return alpha + ((long)(j - f2) * m + (i - f1)) * z;
}

/* 三維 C[l][m][n]，以列為主，索引從 0 開始 */
long loc3_rm(long alpha, int z, int m, int n, int i, int j, int k) {
    return alpha + ((long)i * m * n + (long)j * n + k) * z;
}

int main(void) {
    int a[3][4];
    int ok = 1;
    /* 用 C 的真實位址驗證：C 是以列為主 */
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 4; j++) {
            long real = (long)((char *)&a[i][j] - (char *)&a[0][0]);
            if (real != loc2_rm(0, sizeof(int), 0, 0, 3, i, j)) ok = 0;
        }
    printf("RM 公式和 C 的位址一致：%s\n", ok ? "是" : "否");   /* 是 */

    /* A[-3..5]，α=100，z=4，A[2] 前面有 5 個 */
    printf("%ld\n", loc1(100, 4, -3, 2));                    /* 120 */
    /* A[1..3][1..4]，α=0，z=1，A[2][3] */
    printf("%ld %ld\n", loc2_rm(0, 1, 1, 1, 4, 2, 3),        /* RM：1*4+2 = 6 */
                        loc2_cm(0, 1, 1, 3, 1, 2, 3));       /* CM：2*3+1 = 7 */
    printf("%ld\n", loc3_rm(0, 1, 3, 4, 1, 2, 3));           /* 12+8+3 = 23 */
    return 0;
}
```

### 三角矩陣的壓縮存放 {#alg-triangular}

**想法**：0 的那半不存，把有值的部分一列一列（或一行一行）塞進一維陣列，存取時用公式算出它在第幾格。

**寫程式要注意**：

- 下三角以列為主：第 $i$ 列前面有 $1+2+\cdots+i = \frac{i(i+1)}{2}$ 個，再加 $j$ → 索引 `i*(i+1)/2 + j`（限 $i \ge j$）。
- 上三角以行為主：把 $i$、$j$ 對調 → `j*(j+1)/2 + i`（限 $i \le j$）。
- 讀取時先判斷是不是在 0 的那半，是就直接回傳 0，不要去讀陣列。
- 一維陣列要開 $\frac{n(n+1)}{2}$ 格。
- 對角線矩陣更簡單：`X[i] = DM[i][i]`。

原章節：[[ch2-array#lower-triangular|下三角矩陣]]、[[ch2-array#upper-triangular|上三角矩陣]]、[[ch2-array#diagonal-matrix|對角線矩陣]]

#### C 程式 {#alg-triangular-code .fold}

```c
#include <stdio.h>
#define N 4

int lower_index(int i, int j) { return i * (i + 1) / 2 + j; }   /* i >= j */
int upper_index(int i, int j) { return j * (j + 1) / 2 + i; }   /* i <= j */

int lower_get(const int packed[], int i, int j) {
    if (i < j) return 0;              /* 對角線以上都是 0 */
    return packed[lower_index(i, j)];
}

int main(void) {
    int m[N][N] = {{1, 0, 0, 0},
                   {2, 3, 0, 0},
                   {4, 5, 6, 0},
                   {7, 8, 9, 10}};
    int packed[N * (N + 1) / 2];      /* 10 格就夠 */

    for (int i = 0; i < N; i++)       /* 一列一列存左下半 */
        for (int j = 0; j <= i; j++)
            packed[lower_index(i, j)] = m[i][j];

    printf("%d %d %d\n", lower_get(packed, 2, 1),   /* 5 */
                         lower_get(packed, 1, 3),   /* 0 */
                         lower_index(3, 3));        /* 9（最後一格） */
    printf("%d\n", upper_index(1, 3));               /* 7 */
    return 0;
}
```

### 循序搜尋 {#alg-sequential-search}

**想法**：從第一筆開始一個一個比，找到就停。資料不用排序。

**寫程式要注意**：

- 函數要同時傳**陣列和長度**：C 的陣列傳進函數後只剩指標，函數裡算不出長度。
- 找到回傳索引，找不到回傳 **−1**（不可能的索引），呼叫端才分得出來。
- 找到要立刻 `return`，不要跑完整個迴圈。
- 時間 $O(n)$：最差比 $n$ 次，平均約 $n/2$ 次。

原章節：[[ch2-array#sequential-search|循序搜尋]]

#### C 程式 {#alg-sequential-search-code .fold}

```c
#include <stdio.h>

int seq_search(const int d[], int n, int k) {
    for (int i = 0; i < n; i++)
        if (d[i] == k) return i;      /* 找到就停 */
    return -1;                        /* 全部比完都沒有 */
}

int main(void) {
    int d[] = {48, 12, 98, 37, 62};
    printf("%d %d\n", seq_search(d, 5, 37), seq_search(d, 5, 50));   /* 3 -1 */
    return 0;
}
```

### 二元搜尋 {#alg-binary-search}

**想法**：資料要先排好。每次拿中間那筆比，比較大就丟掉右半、比較小就丟掉左半，範圍每次砍一半。

**寫程式要注意**：

- 用 `low`、`high` 記目前範圍，初值 `0` 和 `n-1`。
- 迴圈條件是 `low <= high`（**有等號**：只剩一筆時也要比）。
- `mid = (low + high) / 2`：整數除法自動捨去小數。
- 更新時要 `mid + 1` 或 `mid - 1`，寫成 `low = mid` 可能永遠停不下來。
- 時間 $O(\log n)$：最多比 $\lfloor\log_2 n\rfloor + 1$ 次。

原章節：[[ch2-array#binary-search|二元搜尋]]

#### C 程式 {#alg-binary-search-code .fold}

```c
#include <stdio.h>

int binary_search(const int d[], int n, int k) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        printf("low=%d high=%d mid=%d d[mid]=%d\n", low, high, mid, d[mid]);
        if (d[mid] == k) return mid;
        else if (d[mid] < k) low = mid + 1;    /* 答案在右半 */
        else                 high = mid - 1;   /* 答案在左半 */
    }
    return -1;
}

int main(void) {
    int d[] = {12, 25, 37, 48, 62, 75, 98, 120, 146};
    printf("找到位置 %d\n", binary_search(d, 9, 120));
    /* 比 3 次：mid=4(62) → mid=6(98) → mid=7(120)，找到位置 7 */
    return 0;
}
```

### 氣泡排序 {#alg-bubble-sort}

**想法**：相鄰兩個比，左邊大就交換。每一回合把目前最大的推到最右邊。

**寫程式要注意**：

- 兩層迴圈：外層 `i` 是「這回合比到哪裡」，從 `n-1` 往下；內層 `j` 從 0 比到 `i-1`，比較 `d[j]` 和 `d[j+1]`。
- 內層上限是 `j < i`，不是 `j < n`：`d[j+1]` 會超出陣列，而且後面已經排好的不用再比。
- 交換三步要用暫存變數 `t`：`t = a; a = b; b = t;`。
- 加一個旗標 `swapped`：某回合完全沒交換就表示已排好，可以提早結束。
- 比較次數 $\frac{n(n-1)}{2}$，$O(n^2)$。

原章節：[[ch2-array#bubble-sort|氣泡排序]]

#### C 程式 {#alg-bubble-sort-code .fold}

```c
#include <stdio.h>

void print_array(const int d[], int n) {
    for (int i = 0; i < n; i++) printf("%d ", d[i]);
    printf("\n");
}

void bubble_sort(int d[], int n) {
    for (int i = n - 1; i > 0; i--) {          /* 回合：比到 d[i] 為止 */
        int swapped = 0;
        for (int j = 0; j < i; j++)
            if (d[j] > d[j + 1]) {
                int t = d[j]; d[j] = d[j + 1]; d[j + 1] = t;
                swapped = 1;
            }
        print_array(d, n);
        if (!swapped) break;                   /* 沒換過 → 已排好 */
    }
}

int main(void) {
    int d[] = {8, 3, 5, 1};
    bubble_sort(d, 4);
    /* 3 5 1 8
       3 1 5 8
       1 3 5 8 */
    return 0;
}
```

### 矩陣轉置、加法與乘法 {#alg-matrix}

**想法**：轉置是 `b[j][i] = a[i][j]`；加法是同位置相加；乘法是「左邊第 $i$ 列」和「右邊第 $j$ 行」對應相乘再加總。

**寫程式要注意**：

- 二維陣列當函數參數時，**第二維（行數）一定要寫出來**，例如 `int a[][N]`，編譯器才知道一列有多長。
- 轉置後大小從 $m\times n$ 變 $n\times m$，結果要放另一個陣列。
- 乘法 $A_{m\times n} B_{n\times p}$：三層迴圈 `i`（列）、`j`（行）、`k`（加總），`c[i][j]` 每格**先設 0** 再累加。
- 乘法共 $m\cdot n\cdot p$ 次乘法；方陣是 $O(n^3)$。

原章節：[[ch2-array#matrix-ops|矩陣運算]]

#### C 程式 {#alg-matrix-code .fold}

```c
#include <stdio.h>
#define M 2
#define N 3
#define P 2

void transpose(int a[][N], int b[][M]) {           /* a 是 M×N，b 是 N×M */
    for (int i = 0; i < M; i++)
        for (int j = 0; j < N; j++)
            b[j][i] = a[i][j];
}

void add(int a[][N], int b[][N], int c[][N]) {
    for (int i = 0; i < M; i++)
        for (int j = 0; j < N; j++)
            c[i][j] = a[i][j] + b[i][j];
}

void multiply(int a[][N], int b[][P], int c[][P]) { /* (M×N)(N×P) = M×P */
    for (int i = 0; i < M; i++)
        for (int j = 0; j < P; j++) {
            c[i][j] = 0;                           /* 先歸零 */
            for (int k = 0; k < N; k++)
                c[i][j] += a[i][k] * b[k][j];
        }
}

int main(void) {
    int a[M][N] = {{1, 2, 3}, {4, 5, 6}};
    int b[N][P] = {{1, 0}, {0, 1}, {1, 1}};
    int t[N][M], s[M][N], c[M][P];

    transpose(a, t);
    printf("轉置第一列：%d %d\n", t[0][0], t[0][1]);      /* 1 4 */
    add(a, a, s);
    printf("a+a 右下角：%d\n", s[1][2]);                  /* 12 */
    multiply(a, b, c);
    printf("乘積：%d %d / %d %d\n", c[0][0], c[0][1], c[1][0], c[1][1]);
    /* 4 5 / 10 11 */
    return 0;
}
```

### 稀疏矩陣轉三行式 {#alg-sparse-3tuple}

**想法**：只記非零元素，每個存成一列（列, 行, 值）。第 0 列放（總列數, 總行數, 非零個數）。

**寫程式要注意**：

- 結果陣列 `t[][3]`，用計數器 `k` 記「下一個要寫到第幾列」，**從 1 開始**（第 0 列留給整體資訊）。
- 掃描順序是先列後行（外層 `i`、內層 `j`），三行式自然就依「先列後行」排好。
- 最後才填第 0 列：非零個數就是 `k - 1`。
- 需要 $3(p+1)$ 格，$p$ 是非零個數。

原章節：[[ch2-array#sparse-matrix|稀疏矩陣]]

#### C 程式 {#alg-sparse-3tuple-code .fold}

```c
#include <stdio.h>
#define ROWS 5
#define COLS 6

int to_3tuple(int m[][COLS], int t[][3]) {
    int k = 1;                                 /* 第 0 列留給整體資訊 */
    for (int i = 0; i < ROWS; i++)
        for (int j = 0; j < COLS; j++)
            if (m[i][j] != 0) {
                t[k][0] = i; t[k][1] = j; t[k][2] = m[i][j];
                k++;
            }
    t[0][0] = ROWS; t[0][1] = COLS; t[0][2] = k - 1;
    return k;                                  /* 共幾列 */
}

int main(void) {
    int m[ROWS][COLS] = {{0, 0, 0, 0, 41, 0},
                         {11, 0, 0, 23, 0, 0},
                         {0, 0, 0, 0, 0, 0},
                         {0, 0, 15, 0, 56, 0},
                         {0, 0, 0, 45, 0, 0}};
    int t[ROWS * COLS + 1][3];
    int rows = to_3tuple(m, t);
    for (int r = 0; r < rows; r++)
        printf("%d: %d %d %d\n", r, t[r][0], t[r][1], t[r][2]);
    /* 0: 5 6 6
       1: 0 4 41
       2: 1 0 11 …… 6: 4 3 45 */
    return 0;
}
```

## 鏈結串列（第 3 章） {#linked-lists}

### 節點、走訪與長度 {#alg-list-basics}

**想法**：每個節點存「資料 + 下一個節點在哪」，最後一個指向 `NULL`。走訪就是從頭沿著 `link` 走到 `NULL`。

**寫程式要注意**：

- 節點宣告是**自我參考結構**：`struct node *link;` 指向同一種結構。
- 用指標存取欄位寫 `p->data`（等於 `(*p).data`）；結構變數本身才用 `.`。
- 要節點：`(struct node *)malloc(sizeof(struct node))`，記得把 `link` 設成 `NULL`。
- 走訪用另一個指標 `p`，**不要直接移動 `front`**，不然串列開頭就找不回來了。
- 迴圈條件 `p != NULL`；長度就是邊走邊數。
- 本頁的 `front` 直接指向第一個資料節點（沒有串列首）；空串列是 `front == NULL`。

原章節：[[ch3-linked-list#singly-node|單向鏈結串列的節點]]、[[ch3-exercises#q-traversal|第 3 章習題：走訪單向串列]]

#### C 程式 {#alg-list-basics-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node {
    int data;
    struct node *link;
};

struct node *make_node(int data) {
    struct node *x = (struct node *)malloc(sizeof(struct node));
    x->data = data;
    x->link = NULL;
    return x;
}

void print_list(struct node *front) {
    for (struct node *p = front; p != NULL; p = p->link)
        printf("%d ", p->data);
    printf("\n");
}

int length(struct node *front) {
    int count = 0;
    for (struct node *p = front; p != NULL; p = p->link) count++;
    return count;
}

/* 由陣列建串列：用 rear 記最後一個，新節點接在後面 */
struct node *build(const int d[], int n) {
    struct node *front = NULL, *rear = NULL;
    for (int i = 0; i < n; i++) {
        struct node *x = make_node(d[i]);
        if (front == NULL) front = x;          /* 第一個節點 */
        else rear->link = x;
        rear = x;
    }
    return front;
}

int main(void) {
    int d[] = {5, 31, 65, 78, 83, 98};
    struct node *front = build(d, 6);
    print_list(front);                         /* 5 31 65 78 83 98 */
    printf("長度 %d\n", length(front));        /* 長度 6 */
    return 0;
}
```

### 單向串列的插入 {#alg-list-insert}

**想法**：插在節點 `p` 後面只要改兩個指標：新節點先接上 `p` 的下一個，`p` 再改指向新節點。

**寫程式要注意**：

- **順序不能反**：先 `x->link = p->link;` 再 `p->link = x;`。反過來做，`p` 原本的下一個就找不到了。
- 插在**最前面**時沒有 `p`，要改的是 `front` 本身。函數要改呼叫端的 `front`，就要傳 `struct node **front`（C++ 可用 `node *&front`），裡面寫 `*front = x;`。
- 依序插入（串列由小到大）：先找最後一個「比 `x` 小」的節點當 `p`；找不到（`x` 最小或串列是空的）就插最前面。
- 找 `p` 的迴圈要先檢查 `p->link != NULL` 才能讀 `p->link->data`。

原章節：[[ch3-linked-list#singly-insert|單向串列的插入]]、[[ch3-exercises#q-singly-insert|第 3 章習題：單向串列插入]]

#### C 程式 {#alg-list-insert-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };

struct node *make_node(int data) {
    struct node *x = (struct node *)malloc(sizeof(struct node));
    x->data = data; x->link = NULL;
    return x;
}

void print_list(struct node *front) {
    for (struct node *p = front; p != NULL; p = p->link) printf("%d ", p->data);
    printf("\n");
}

void insert_after(struct node *p, struct node *x) {
    x->link = p->link;        /* 1. 新節點先接上 p 原本的下一個 */
    p->link = x;              /* 2. p 再改指向新節點 */
}

void insert_front(struct node **front, struct node *x) {
    x->link = *front;
    *front = x;               /* 改呼叫端的 front */
}

/* 串列由小到大，插入後仍保持排序 */
void insert_sorted(struct node **front, int data) {
    struct node *x = make_node(data);
    if (*front == NULL || data < (*front)->data) {   /* 比第一個還小 */
        insert_front(front, x);
        return;
    }
    struct node *p = *front;
    while (p->link != NULL && p->link->data < data)  /* 找最後一個比它小的 */
        p = p->link;
    insert_after(p, x);
}

int main(void) {
    struct node *front = NULL;
    int d[] = {31, 98, 5, 65, 15, 3};
    for (int i = 0; i < 6; i++) insert_sorted(&front, d[i]);
    print_list(front);                         /* 3 5 15 31 65 98 */
    return 0;
}
```

### 單向串列的刪除 {#alg-list-delete}

**想法**：要刪 `q`，就讓它**前一個**節點 `p` 直接跳過它指向 `q` 的下一個，再把 `q` 歸還。

**寫程式要注意**：

- 單向串列只能往後走，所以要找的是**要刪節點的前一個** `p`。
- 三步：`q = p->link;`（記住要刪的）→ `p->link = q->link;`（跳過）→ `free(q);`。
- 不能先 `free(q)` 再讀 `q->link`：釋放後的記憶體不能再用。
- 刪**第一個**節點時沒有前一個，要改 `front`：`q = *front; *front = q->link; free(q);`，所以一樣傳 `struct node **`。
- 找不到要刪的值時什麼都不做，回傳 0 讓呼叫端知道。

原章節：[[ch3-linked-list#singly-delete|單向串列的刪除]]、[[ch3-exercises#q-singly-delete|第 3 章習題：單向串列刪除]]

#### C 程式 {#alg-list-delete-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };

struct node *build(const int d[], int n) {
    struct node *front = NULL, *rear = NULL;
    for (int i = 0; i < n; i++) {
        struct node *x = (struct node *)malloc(sizeof(struct node));
        x->data = d[i]; x->link = NULL;
        if (front == NULL) front = x; else rear->link = x;
        rear = x;
    }
    return front;
}

void print_list(struct node *front) {
    for (struct node *p = front; p != NULL; p = p->link) printf("%d ", p->data);
    printf("\n");
}

int delete_value(struct node **front, int data) {
    if (*front == NULL) return 0;
    if ((*front)->data == data) {              /* 刪第一個：改 front */
        struct node *q = *front;
        *front = q->link;
        free(q);
        return 1;
    }
    struct node *p = *front;                   /* 找要刪的節點的前一個 */
    while (p->link != NULL && p->link->data != data)
        p = p->link;
    if (p->link == NULL) return 0;             /* 找不到 */
    struct node *q = p->link;                  /* 1. 記住要刪的 */
    p->link = q->link;                         /* 2. 跳過它 */
    free(q);                                   /* 3. 歸還 */
    return 1;
}

int main(void) {
    int d[] = {5, 31, 65, 78, 83, 98};
    struct node *front = build(d, 6);
    delete_value(&front, 98);                  /* 刪最後一個 */
    delete_value(&front, 5);                   /* 刪第一個 */
    printf("%d\n", delete_value(&front, 50));  /* 0：找不到 */
    print_list(front);                         /* 31 65 78 83 */
    return 0;
}
```

### 反轉單向串列 {#alg-list-invert}

**想法**：從頭走到尾，把每個節點的箭頭轉向。用三個指標：`head` 是還沒處理的、`mid` 是正在轉的、`last` 是已經轉好那段的開頭。

**寫程式要注意**：

- 迴圈裡四行的順序固定：`last = mid; mid = head; head = head->link; mid->link = last;`。
- `head` 必須在 `mid->link` 被改掉**之前**先往前走，否則後半段串列就斷了。
- `mid` 初值 `NULL`：原本的第一個節點反轉後要變成最後一個，指向 `NULL`。
- 迴圈結束時 `mid` 是新的開頭，要回傳它。
- 只走一次，$O(n)$，不用額外配置節點。

原章節：[[ch3-linked-list#singly-invert|反轉單向串列]]

#### C 程式 {#alg-list-invert-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };

struct node *build(const int d[], int n) {
    struct node *front = NULL, *rear = NULL;
    for (int i = 0; i < n; i++) {
        struct node *x = (struct node *)malloc(sizeof(struct node));
        x->data = d[i]; x->link = NULL;
        if (front == NULL) front = x; else rear->link = x;
        rear = x;
    }
    return front;
}

void print_list(struct node *front) {
    for (struct node *p = front; p != NULL; p = p->link) printf("%d ", p->data);
    printf("\n");
}

struct node *invert(struct node *head) {
    struct node *mid = NULL, *last;
    while (head != NULL) {
        last = mid;            /* last 跟上 mid */
        mid = head;            /* mid 跟上 head */
        head = head->link;     /* head 先往前走 */
        mid->link = last;      /* 再把 mid 轉向 */
    }
    return mid;                /* 新的開頭 */
}

int main(void) {
    int d[] = {1, 2, 3, 4};
    struct node *front = invert(build(d, 4));
    print_list(front);         /* 4 3 2 1 */
    return 0;
}
```

### 串列合併與釋放 {#alg-list-concat-free}

**想法**：合併就是走到 $x$ 的最後一個節點，把它接到 $y$ 的開頭；釋放就是邊走邊 `free`。

**寫程式要注意**：

- 合併先處理空串列：$x$ 空回傳 $y$、$y$ 空回傳 $x$。
- 找最後一個節點的條件是 `p->link != NULL`（停在最後一個），不是 `p != NULL`（會走過頭變 `NULL`）。
- 釋放時先用 `tmp` 記住目前節點、`p` 往前走，**最後**才 `free(tmp)`。先 `free(p)` 再讀 `p->link` 是錯的。
- 釋放完把 `front` 設成 `NULL`，避免之後誤用已釋放的位址。

原章節：[[ch3-linked-list#singly-utils|串列長度、合併與釋放]]、[[ch3-exercises#q-concatenate|第 3 章習題：串列合併]]

#### C 程式 {#alg-list-concat-free-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };

struct node *build(const int d[], int n) {
    struct node *front = NULL, *rear = NULL;
    for (int i = 0; i < n; i++) {
        struct node *x = (struct node *)malloc(sizeof(struct node));
        x->data = d[i]; x->link = NULL;
        if (front == NULL) front = x; else rear->link = x;
        rear = x;
    }
    return front;
}

void print_list(struct node *front) {
    for (struct node *p = front; p != NULL; p = p->link) printf("%d ", p->data);
    printf("\n");
}

struct node *concatenate(struct node *x, struct node *y) {
    if (x == NULL) return y;
    if (y == NULL) return x;
    struct node *p = x;
    while (p->link != NULL) p = p->link;       /* 停在 x 的最後一個 */
    p->link = y;
    return x;
}

void free_list(struct node **front) {
    struct node *p = *front, *tmp;
    while (p != NULL) {
        tmp = p;               /* 記住目前節點 */
        p = p->link;           /* 先往前走 */
        free(tmp);             /* 再釋放 */
    }
    *front = NULL;
}

int main(void) {
    int a[] = {1, 2}, b[] = {3, 4, 5};
    struct node *z = concatenate(build(a, 2), build(b, 3));
    print_list(z);             /* 1 2 3 4 5 */
    free_list(&z);
    printf("%s\n", z == NULL ? "已釋放" : "?");
    return 0;
}
```

### 雙向串列的插入與刪除 {#alg-doubly}

**想法**：每個節點有往前 `l_link`、往後 `r_link` 兩個指標。插入在 `p` 和 `q` 之間要改 4 個指標；刪除 `x` 只要讓前後兩個互相跳過它。

**寫程式要注意**：

- 插入：先設好新節點自己的兩個指標，再改鄰居的。課本順序是 `x->l_link = p; x->r_link = q; q->l_link = x; p->r_link = x;`，**`p->r_link` 最後改**，因為 `q` 是靠它找到的。
- 刪除 `x`：`x->l_link->r_link = x->r_link; x->r_link->l_link = x->l_link;`，不需要先找前一個（單向串列做不到）。
- 在頭或尾操作時鄰居可能是 `NULL`，讀 `q->l_link` 前要先檢查 `q != NULL`。
- 刪除頭節點時也要更新 `front`。

原章節：[[ch3-linked-list#doubly-ops|雙向串列的插入與刪除]]、[[ch3-exercises#q-doubly|第 3 章習題：雙向串列插入與刪除]]

#### C 程式 {#alg-doubly-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct dnode {
    int data;
    struct dnode *l_link, *r_link;
};

struct dnode *make_dnode(int data) {
    struct dnode *x = (struct dnode *)malloc(sizeof(struct dnode));
    x->data = data; x->l_link = x->r_link = NULL;
    return x;
}

void print_both(struct dnode *front) {
    struct dnode *p = front, *last = NULL;
    for (; p != NULL; p = p->r_link) { printf("%d ", p->data); last = p; }
    printf("| ");
    for (p = last; p != NULL; p = p->l_link) printf("%d ", p->data);  /* 倒著走 */
    printf("\n");
}

void insert_after(struct dnode *p, struct dnode *x) {
    struct dnode *q = p->r_link;        /* 原本 p 的下一個（可能是 NULL） */
    x->l_link = p;                      /* 新節點往前接 p */
    x->r_link = q;                      /* 新節點往後接 q */
    if (q != NULL) q->l_link = x;       /* q 往前改接新節點 */
    p->r_link = x;                      /* p 往後改接新節點（最後做） */
}

void delete_node(struct dnode **front, struct dnode *x) {
    if (x->l_link != NULL) x->l_link->r_link = x->r_link;   /* 前一個跳過 x */
    else *front = x->r_link;                                 /* x 是第一個 */
    if (x->r_link != NULL) x->r_link->l_link = x->l_link;   /* 後一個跳過 x */
    free(x);
}

int main(void) {
    struct dnode *front = make_dnode(10);
    insert_after(front, make_dnode(30));
    insert_after(front, make_dnode(20));       /* 插在 10 和 30 中間 */
    print_both(front);                         /* 10 20 30 | 30 20 10 */
    delete_node(&front, front->r_link);        /* 刪 20 */
    delete_node(&front, front);                /* 刪第一個 10 */
    print_both(front);                         /* 30 | 30 */
    return 0;
}
```

### 環狀串列 {#alg-circular-list}

**想法**：最後一個節點指回第一個，串列變成一個圈。

**寫程式要注意**：

- 走訪不能用 `p != NULL` 當條件（永遠不會遇到 `NULL`），改成「**回到起點就停**」。用 `do { … } while (p != front);` 最自然：先印一個再判斷。
- 插在最前面或刪掉第一個時，**最後一個節點的 link 也要改**，所以要先找到最後一個（或乾脆只記 `last`，`last->link` 就是第一個）。
- 只有一個節點時，它自己指向自己；刪掉它之後 `front` 要變 `NULL`。

原章節：[[ch3-linked-list#circular-list|環狀串列]]、[[ch3-exercises#q-circular-singly|第 3 章習題：環狀單向串列]]

#### C 程式 {#alg-circular-list-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };

void print_circle(struct node *front) {
    if (front == NULL) { printf("(空)\n"); return; }
    struct node *p = front;
    do {                                   /* 先印再判斷 */
        printf("%d ", p->data);
        p = p->link;
    } while (p != front);                  /* 回到起點就停 */
    printf("\n");
}

struct node *find_last(struct node *front) {
    struct node *p = front;
    while (p->link != front) p = p->link;
    return p;
}

void insert_front(struct node **front, int data) {
    struct node *x = (struct node *)malloc(sizeof(struct node));
    x->data = data;
    if (*front == NULL) { x->link = x; *front = x; return; }   /* 自己指自己 */
    struct node *last = find_last(*front);
    x->link = *front;                      /* 新節點指向原第一個 */
    last->link = x;                        /* 最後一個改指新節點 */
    *front = x;
}

void delete_front(struct node **front) {
    struct node *q = *front;
    if (q == NULL) return;
    if (q->link == q) { free(q); *front = NULL; return; }       /* 只有一個 */
    struct node *last = find_last(q);
    last->link = q->link;                  /* 最後一個改指第二個 */
    *front = q->link;
    free(q);
}

int main(void) {
    struct node *front = NULL;
    insert_front(&front, 98);
    insert_front(&front, 31);
    insert_front(&front, 5);
    print_circle(front);                   /* 5 31 98 */
    insert_front(&front, 99);
    delete_front(&front);
    delete_front(&front);
    print_circle(front);                   /* 31 98 */
    return 0;
}
```

### 多項式相加（鏈結） {#alg-poly-add}

**想法**：兩個多項式都依指數由大到小串好。兩個指標同時往下走，像合併兩條排好的隊伍。

**寫程式要注意**：

- 節點存 `coef`、`exp`、`link`。
- 迴圈條件 `while (a != NULL && b != NULL)`：
  - 指數相同 → 係數相加，**和不是 0 才放進答案**，兩邊都往下走。
  - 指數不同 → 指數大的那項放進答案，只移動那一邊。
- 迴圈結束後，**還沒走完的那一邊剩下的項全部接上**（很容易漏掉）。
- 答案用 `rear` 指標記最後一項，新的項直接接在後面，不用每次從頭找。

原章節：[[ch3-linked-list#poly-linked|多項式的鏈結表示法]]

#### C 程式 {#alg-poly-add-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct pnode {
    int coef, exp;
    struct pnode *link;
};

/* 把 (coef, exp) 接到答案最後面 */
void append(struct pnode **front, struct pnode **rear, int coef, int exp) {
    struct pnode *x = (struct pnode *)malloc(sizeof(struct pnode));
    x->coef = coef; x->exp = exp; x->link = NULL;
    if (*front == NULL) *front = x; else (*rear)->link = x;
    *rear = x;
}

struct pnode *poly_add(struct pnode *a, struct pnode *b) {
    struct pnode *front = NULL, *rear = NULL;
    while (a != NULL && b != NULL) {
        if (a->exp == b->exp) {
            int sum = a->coef + b->coef;
            if (sum != 0) append(&front, &rear, sum, a->exp);
            a = a->link; b = b->link;
        } else if (a->exp > b->exp) {
            append(&front, &rear, a->coef, a->exp); a = a->link;
        } else {
            append(&front, &rear, b->coef, b->exp); b = b->link;
        }
    }
    for (; a != NULL; a = a->link) append(&front, &rear, a->coef, a->exp);  /* 剩下的 */
    for (; b != NULL; b = b->link) append(&front, &rear, b->coef, b->exp);
    return front;
}

void print_poly(struct pnode *p) {
    for (; p != NULL; p = p->link)
        printf("%dx^%d%s", p->coef, p->exp, p->link ? " + " : "\n");
}

int main(void) {
    struct pnode *a = NULL, *ra = NULL, *b = NULL, *rb = NULL;
    append(&a, &ra, 6, 5); append(&a, &ra, 12, 3); append(&a, &ra, 11, 0);
    append(&b, &rb, 3, 3); append(&b, &rb, 2, 1);
    print_poly(poly_add(a, b));   /* 6x^5 + 15x^3 + 2x^1 + 11x^0 */
    return 0;
}
```

## 堆疊與佇列（第 4 章） {#stacks-queues}

### 以陣列實作堆疊 {#alg-stack-array}

**想法**：一個陣列加一個 `top` 記最上面那筆在第幾格。後進先出（LIFO）。

**寫程式要注意**：

- 初值 `top = -1`；滿是 `top == N-1`；空是 `top == -1`（或 `top < 0`）。
- push 是「**先移再放**」`stack[++top] = x;`，pop 是「**先拿再移**」`return stack[top--];`。前置 `++top` 和後置 `top--` 的差別就是這個順序。
- push 前一定要檢查滿、pop 前一定要檢查空，否則會寫到陣列外面。
- `stack`、`top` 宣告成全域變數，push、pop 才都能改到（或包成 `struct` 傳指標）。
- C++ 現成的 `std::stack<int> s; s.push(x); s.top(); s.pop();`。

原章節：[[ch4-stack-queue#stack-array|以陣列實作堆疊]]

#### C 程式 {#alg-stack-array-code .fold}

```c
#include <stdio.h>
#define N 3

int stack[N];
int top = -1;

int is_full(void)  { return top == N - 1; }
int is_empty(void) { return top == -1; }

int push(int x) {
    if (is_full()) { printf("堆疊已滿\n"); return 0; }
    stack[++top] = x;          /* 先移再放 */
    return 1;
}

int pop(int *x) {
    if (is_empty()) { printf("堆疊已空\n"); return 0; }
    *x = stack[top--];         /* 先拿再移 */
    return 1;
}

int main(void) {
    int x;
    push(1); push(2); push(3);
    push(4);                                   /* 堆疊已滿 */
    while (pop(&x)) printf("%d ", x);          /* 3 2 1 堆疊已空 */
    printf("\n");
    return 0;
}
```

### 以鏈結串列實作堆疊 {#alg-stack-linked}

**想法**：`top` 指向第一個節點。push 插在最前面、pop 從最前面拿，都只改一兩個指標，而且不會滿。

**寫程式要注意**：

- 空堆疊是 `top == NULL`。
- push：`x->link = top; top = x;`（新節點指向原頂端，`top` 再改指新節點）。
- pop：`x = top;` 記住 → 取 `x->data` → `top = x->link;` → `free(x);`。資料要在 `free` 之前拿出來。
- 跟陣列版比：不用事先決定大小，但每個節點多一個指標的空間，而且要 `malloc`。

原章節：[[ch4-stack-queue#stack-linked|以鏈結串列實作堆疊]]

#### C 程式 {#alg-stack-linked-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };
struct node *top = NULL;

void push(int data) {
    struct node *x = (struct node *)malloc(sizeof(struct node));
    x->data = data;
    x->link = top;             /* 新節點指向原頂端 */
    top = x;
}

int pop(int *data) {
    if (top == NULL) return 0;
    struct node *x = top;
    *data = x->data;           /* 先拿資料 */
    top = x->link;             /* top 往下移 */
    free(x);                   /* 最後才釋放 */
    return 1;
}

int main(void) {
    int d;
    for (int i = 1; i <= 4; i++) push(i * 10);
    while (pop(&d)) printf("%d ", d);          /* 40 30 20 10 */
    printf("\n");
    return 0;
}
```

### 以陣列實作佇列 {#alg-queue-array}

**想法**：從 `rear` 端加入、從 `front` 端刪除，先進先出（FIFO）。

**寫程式要注意**：

- 課本慣例：`front` 指向**第一筆的前一格**，`rear` 指向**最後一筆**，初值都是 `-1`。
- 空是 `front == rear`；滿是 `rear == N-1`。
- 加入：`queue[++rear] = x;`；刪除：`x = queue[++front];`（兩個指標都只往右走）。
- 缺點：刪掉的格子不能再用，`rear` 到底就說滿了，即使前面有空位 → 用環狀佇列解決。
- C++ 現成的 `std::queue<int> q; q.push(x); q.front(); q.pop();`。

原章節：[[ch4-stack-queue#queue-array|以陣列實作佇列]]

#### C 程式 {#alg-queue-array-code .fold}

```c
#include <stdio.h>
#define N 3

int queue[N];
int front = -1, rear = -1;

int add(int x) {
    if (rear == N - 1) { printf("佇列已滿\n"); return 0; }
    queue[++rear] = x;
    return 1;
}

int del(int *x) {
    if (front == rear) { printf("佇列已空\n"); return 0; }
    *x = queue[++front];
    return 1;
}

int main(void) {
    int x;
    add(1); add(2); add(3);
    del(&x); printf("刪除 %d\n", x);       /* 刪除 1 */
    add(4);                                /* 佇列已滿：前面空出來的格子用不到 */
    return 0;
}
```

### 以鏈結串列實作佇列 {#alg-queue-linked}

**想法**：`front` 指第一個節點（刪除端）、`rear` 指最後一個（加入端）。

**寫程式要注意**：

- 空佇列是 `front == NULL`。
- 加入：新節點 `link = NULL`；如果原本是空的，`front` 和 `rear` **都**指向它；否則 `rear->link = x; rear = x;`。
- 刪除：從 `front` 拿。刪完如果 `front` 變 `NULL`（剛刪掉最後一個），`rear` 也要設成 `NULL`，否則 `rear` 指向已釋放的節點。
- 空串列這兩個特殊情況是最常被扣分的地方。

原章節：[[ch4-stack-queue#queue-linked|以鏈結串列實作佇列]]

#### C 程式 {#alg-queue-linked-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct node { int data; struct node *link; };
struct node *front = NULL, *rear = NULL;

void add(int data) {
    struct node *x = (struct node *)malloc(sizeof(struct node));
    x->data = data; x->link = NULL;
    if (front == NULL) front = rear = x;       /* 原本是空的 */
    else { rear->link = x; rear = x; }
}

int del(int *data) {
    if (front == NULL) return 0;
    struct node *x = front;
    *data = x->data;
    front = x->link;
    if (front == NULL) rear = NULL;            /* 刪完變空，rear 也要清 */
    free(x);
    return 1;
}

int main(void) {
    int d;
    add(1); add(2);
    del(&d); printf("%d ", d);
    add(3);
    while (del(&d)) printf("%d ", d);          /* 1 2 3 */
    printf("\n");
    return 0;
}
```

### 環狀佇列 {#alg-circular-queue}

**想法**：把陣列想成頭尾相接的環，`rear` 到最後一格之後繞回第 0 格，前面空出的格子可以再用。

**寫程式要注意**：

- 「繞回去」用取餘數：`rear = (rear + 1) % N;`、`front = (front + 1) % N;`。
- 課本初值 `front = rear = N-1`（也可以設 0，只要兩者相等）。
- 空：`front == rear`；滿：`(rear + 1) % N == front`。
- **只能放 $N-1$ 個**：`front` 指的那格永遠留空，否則放滿時 `front == rear` 和「空」分不出來。
- 加入時要**先算出下一格再判斷滿**，滿了就不能真的移動 `rear`。

原章節：[[ch4-stack-queue#circular-queue|環狀佇列]]、[[ch4-exercises#q-full-empty|第 4 章習題：陣列實作的滿與空]]

#### C 程式 {#alg-circular-queue-code .fold}

```c
#include <stdio.h>
#define N 4

char queue[N];
int front = N - 1, rear = N - 1;

int add(char x) {
    int next = (rear + 1) % N;
    if (next == front) { printf("加入 %c：已滿\n", x); return 0; }
    rear = next;
    queue[rear] = x;
    printf("加入 %c：front=%d rear=%d\n", x, front, rear);
    return 1;
}

int del(char *x) {
    if (front == rear) { printf("已空\n"); return 0; }
    front = (front + 1) % N;
    *x = queue[front];
    printf("刪除 %c：front=%d rear=%d\n", *x, front, rear);
    return 1;
}

int main(void) {
    char x;
    add('A'); add('B'); add('C');   /* rear 0, 1, 2 */
    add('D');                       /* 已滿：N=4 只能放 3 個 */
    del(&x);                        /* 刪除 A：front=0 */
    add('D');                       /* rear=3 */
    add('E');                       /* (3+1)%4 = 0 = front，已滿 */
    return 0;
}
```

### 多重堆疊 {#alg-multiple-stacks}

**想法**：多個堆疊共用一個大陣列，每個堆疊分一段，用 `b[i]` 記第 $i$ 段起點的前一格、`t[i]` 記頂端。

**寫程式要注意**：

- 第 $i$ 號堆疊佔 `b[i]+1` 到 `b[i+1]`，所以 `b` 陣列要多開一格放最後的邊界 `b[m] = N-1`。
- 初值 `b[i] = t[i] = i * (N/m) - 1`（每段大小 `N/m`）。
- 空：`t[i] == b[i]`；滿：`t[i] == b[i+1]`（碰到下一段的邊界）。
- push／pop 就是單一堆疊的寫法，把 `top` 換成 `t[i]`、上下限換成 `b[i]`、`b[i+1]`。
- 某段滿了而其他段還有空位時，課本是重新分配邊界（搬移資料），這部分通常不考程式。

原章節：[[ch4-stack-queue#multiple-stacks|多重堆疊]]

#### C 程式 {#alg-multiple-stacks-code .fold}

```c
#include <stdio.h>
#define N 9
#define M 3          /* 3 個堆疊 */

int stack[N];
int b[M + 1], t[M];

void init(void) {
    for (int i = 0; i < M; i++) b[i] = t[i] = i * (N / M) - 1;
    b[M] = N - 1;                              /* 最後的邊界 */
}

int push(int i, int x) {
    if (t[i] == b[i + 1]) { printf("堆疊 %d 已滿\n", i); return 0; }
    stack[++t[i]] = x;
    return 1;
}

int pop(int i, int *x) {
    if (t[i] == b[i]) { printf("堆疊 %d 已空\n", i); return 0; }
    *x = stack[t[i]--];
    return 1;
}

int main(void) {
    int x;
    init();                                    /* b = -1, 2, 5, 8 */
    push(1, 10); push(1, 11); push(1, 12);
    push(1, 13);                               /* 堆疊 1 已滿 */
    pop(1, &x); printf("%d\n", x);             /* 12 */
    pop(0, &x);                                /* 堆疊 0 已空 */
    return 0;
}
```

### 雙向佇列 {#alg-deque}

**想法**（課本定義）：一個陣列裡放兩個佇列，左邊的從左往右長、右邊的從右往左長，共用中間的空位，兩邊碰頭才算滿。

**寫程式要注意**：

- 左佇列 `f0 = r0 = -1`，加入時 `++r0`、刪除時 `++f0`。
- 右佇列 `f1 = r1 = N`，方向相反：加入時 `--r1`、刪除時 `--f1`。
- 各自空：`f0 == r0`、`f1 == r1`；滿溢：`r0 + 1 == r1`（中間沒空位）。
- 一般教科書說的 deque 是「兩端都能加入刪除的一條佇列」，C++ 的 `std::deque`（`push_front`、`push_back`、`pop_front`、`pop_back`）是那一種，跟課本這個定義不同。

原章節：[[ch4-stack-queue#deque|雙向佇列]]

#### C 程式 {#alg-deque-code .fold}

```c
#include <stdio.h>
#define N 5

int q[N];
int f0 = -1, r0 = -1;      /* 左佇列：往右長 */
int f1 = N,  r1 = N;       /* 右佇列：往左長 */

int add_left(int x)  { if (r0 + 1 == r1) { printf("滿溢\n"); return 0; } q[++r0] = x; return 1; }
int add_right(int x) { if (r0 + 1 == r1) { printf("滿溢\n"); return 0; } q[--r1] = x; return 1; }

int del_left(int *x)  { if (f0 == r0) return 0; *x = q[++f0]; return 1; }
int del_right(int *x) { if (f1 == r1) return 0; *x = q[--f1]; return 1; }

int main(void) {
    int x;
    add_left(1); add_left(2); add_left(3);
    add_right(9); add_right(8);
    add_right(7);                              /* 滿溢：r0=2, r1=3 */
    del_left(&x);  printf("%d ", x);           /* 1（左邊先進先出） */
    del_right(&x); printf("%d\n", x);          /* 9 */
    return 0;
}
```

### 優先佇列（陣列版） {#alg-priority-queue}

**想法**：資料分 A、B、C 三級，高等級先出，同等級先進先出。陣列裡 A、B、C 三段依序連著放，`r[k]` 記第 $k$ 級最後一筆在哪。

**寫程式要注意**：

- 加入第 $L$ 級：位置是 `r[L] + 1`。後面的資料要**從最後面往前**一格一格往後搬，才不會蓋掉還沒搬的資料。
- 搬完後，第 $L$ 級和它後面所有等級的 `r[k]` 都要加 1。
- 刪除永遠拿 `q[0]`（最高級的第一筆），後面全部往前搬，每個 `r[k]` 減 1（還是 −1 的不動）。
- 課本的缺點就是要一直搬資料；鏈結版只改指標。
- C++ 的 `std::priority_queue` 會依優先順序出，但**不保證同級先進先出**，用它要另外加流水號。

原章節：[[ch4-stack-queue#priority-queue|優先佇列]]

#### C 程式 {#alg-priority-queue-code .fold}

```c
#include <stdio.h>
#define N 10

const char *q[N];
int r[3] = {-1, -1, -1};      /* r[0]=A 級尾、r[1]=B 級尾、r[2]=C 級尾 */

int add(const char *x, int level) {          /* level：0=A、1=B、2=C */
    if (r[2] == N - 1) { printf("已滿\n"); return 0; }
    int pos = r[level] + 1;
    for (int i = r[2]; i >= pos; i--)          /* 從最後面往前搬 */
        q[i + 1] = q[i];
    q[pos] = x;
    for (int k = level; k < 3; k++) r[k]++;
    return 1;
}

int del(const char **x) {
    if (r[2] == -1) return 0;
    *x = q[0];
    for (int i = 0; i < r[2]; i++) q[i] = q[i + 1];   /* 全部往前搬 */
    for (int k = 0; k < 3; k++) if (r[k] >= 0) r[k]--;
    return 1;
}

int main(void) {
    const char *x;
    add("b1", 1); add("c1", 2); add("a1", 0); add("b2", 1); add("a2", 0);
    while (del(&x)) printf("%s ", x);          /* a1 a2 b1 b2 c1 */
    printf("\n");
    return 0;
}
```

### 中置式轉後置式 {#alg-infix-to-postfix}

**想法**：由左到右讀。運算元直接輸出；運算子先放進堆疊等，等確定沒有更優先的要先做才輸出。

**寫程式要注意**：

- 寫一個 `priority(op)` 函數：`^` 3、`*` `/` 2、`+` `-` 1、`(` 0。`(` 最低，運算子才不會把它彈出。
- 讀到運算子：**當堆疊頂端的優先順序 ≥ 自己**就一直 pop 輸出，最後再 push 自己。條件是 `while (top >= 0 && priority(stack[top]) >= priority(c))`，**先檢查堆疊非空**。
- 讀到 `(` 直接 push；讀到 `)` 一直 pop 輸出到遇見 `(`，`(` 丟掉不輸出。
- 讀完後把堆疊剩下的全部 pop 輸出。
- 輸出字串最後要補 `'\0'`。
- 課本對 `^` 也用 ≥，所以 `a^b^c` 會轉成 `ab^c^`（由左到右）；考題沒有連續 `^` 時不影響。

原章節：[[ch4-stack-queue#infix-to-postfix|用堆疊轉後置式]]、[[ch4-exercises#q-infix-to-postfix|第 4 章習題：中置式轉後置式]]

#### C 程式 {#alg-infix-to-postfix-code .fold}

```c
#include <stdio.h>
#include <ctype.h>

int priority(char op) {
    switch (op) {
        case '^': return 3;
        case '*': case '/': return 2;
        case '+': case '-': return 1;
        default: return 0;                    /* '(' */
    }
}

void infix_to_postfix(const char *in, char *out) {
    char stack[100];
    int top = -1, k = 0;
    for (int i = 0; in[i] != '\0'; i++) {
        char c = in[i];
        if (isalnum((unsigned char)c)) out[k++] = c;          /* 運算元直接輸出 */
        else if (c == '(') stack[++top] = c;
        else if (c == ')') {
            while (stack[top] != '(') out[k++] = stack[top--];
            top--;                                            /* 丟掉 '(' */
        } else {                                              /* 運算子 */
            while (top >= 0 && priority(stack[top]) >= priority(c))
                out[k++] = stack[top--];
            stack[++top] = c;
        }
    }
    while (top >= 0) out[k++] = stack[top--];                 /* 剩下的全部輸出 */
    out[k] = '\0';
}

int main(void) {
    const char *tests[] = {"a+b/(c-d)*e-f", "a^b-c/d+e", "a-b*(c+d)^e"};
    char out[100];
    for (int i = 0; i < 3; i++) {
        infix_to_postfix(tests[i], out);
        printf("%s → %s\n", tests[i], out);
    }
    /* abcd-/e*+f-、ab^cd/-e+、abcd+e^*- */
    return 0;
}
```

### 後置式求值 {#alg-postfix-eval}

**想法**：讀到運算元就 push；讀到運算子就 pop 兩個出來算，結果再 push 回去。最後堆疊剩下的就是答案。

**寫程式要注意**：

- **先 pop 出來的是右運算元**：`right = stack[top--]; left = stack[top--];`，再算 `left op right`。減法和除法弄反就錯。
- 字元數字轉整數：`c - '0'`（只適用一位數）。
- 堆疊型別要跟計算結果一致（這裡用 `int`）。
- 合法的後置式讀完時，堆疊剛好剩一個；不是一個代表算式寫錯。

原章節：[[ch4-stack-queue#postfix-eval|後置式求值]]、[[ch4-exercises#q-postfix-eval|第 4 章習題：後置式求值]]

#### C 程式 {#alg-postfix-eval-code .fold}

```c
#include <stdio.h>
#include <ctype.h>

int eval_postfix(const char *s) {
    int stack[100], top = -1;
    for (int i = 0; s[i] != '\0'; i++) {
        char c = s[i];
        if (isdigit((unsigned char)c)) stack[++top] = c - '0';
        else {
            int right = stack[top--];          /* 先出來的是右邊 */
            int left  = stack[top--];
            int r = 0;
            switch (c) {
                case '+': r = left + right; break;
                case '-': r = left - right; break;
                case '*': r = left * right; break;
                case '/': r = left / right; break;
            }
            stack[++top] = r;
        }
    }
    return stack[top];
}

int main(void) {
    /* abcd-/e*+，a=1 b=4 c=3 d=1 e=2 */
    printf("%d\n", eval_postfix("1431-/2*+"));   /* 5 */
    printf("%d\n", eval_postfix("42/"));         /* 2：是 4/2 不是 2/4 */
    return 0;
}
```

## 遞迴（第 5 章） {#recursion}

### 次方與階乘 {#alg-power-factorial}

**想法**：$2^n = 2 \times 2^{n-1}$、$n! = n \times (n-1)!$：大問題用「同樣但小一號的問題」表示，小到不能再小就直接給答案。

**寫程式要注意**：

- 遞迴兩要素：**終止條件**（$n = 0$ 回傳 1）和**呼叫自己時引數變小**（`n - 1`）。少了任一個就會無限呼叫，最後堆疊溢位。
- 終止條件寫在最前面。
- 每次呼叫都會把參數和返回位址 push 到系統堆疊，所以 $n$ 層遞迴要 $O(n)$ 的堆疊空間。
- 非遞迴版就是一個 `for` 迴圈累乘，見程式後半。

原章節：[[ch5-recursion#how-recursion-works|遞迴函數的運作原理]]、[[ch5-recursion#recursive-factorial|計算 n 階乘]]、[[ch5-exercises#q-iterative|第 5 章習題：非遞迴版本]]

#### C 程式 {#alg-power-factorial-code .fold}

```c
#include <stdio.h>

long two_power_n(int n) {
    if (n == 0) return 1;                      /* 終止條件 */
    return 2 * two_power_n(n - 1);             /* 引數變小 */
}

long power(long n, int m) {                    /* n 的 m 次方 */
    if (m == 0) return 1;
    return n * power(n, m - 1);
}

long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

/* 非遞迴版 */
long power_nr(long n, int m)  { long r = 1; for (int i = 0; i < m; i++) r *= n; return r; }
long factorial_nr(int n)      { long r = 1; for (int i = 2; i <= n; i++) r *= i; return r; }

int main(void) {
    printf("%ld %ld %ld\n", two_power_n(10), power(3, 4), factorial(5));   /* 1024 81 120 */
    printf("%ld %ld\n", power_nr(3, 4), factorial_nr(5));                  /* 81 120 */
    return 0;
}
```

### 費氏數列 {#alg-fibonacci}

**想法**：$F_0 = 0$、$F_1 = 1$、$F_n = F_{n-1} + F_{n-2}$。

**寫程式要注意**：

- 有**兩個**終止條件（$n = 0$ 和 $n = 1$），只寫一個會算到負數停不下來。
- 遞迴版一次呼叫分出兩支，同一個值會被重算很多次（呼叫樹），時間約 $O(2^n)$。
- 迴圈版只要記住「前兩個」：`a, b` 一路往前推，$O(n)$。這就是「遞迴好寫但不一定快」的例子。

原章節：[[ch5-recursion#recursive-fibonacci|費氏數列]]

#### C 程式 {#alg-fibonacci-code .fold}

```c
#include <stdio.h>

int calls = 0;

long fib(int n) {
    calls++;
    if (n == 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}

long fib_nr(int n) {
    long a = 0, b = 1;                 /* F(0), F(1) */
    for (int i = 0; i < n; i++) {
        long t = a + b;
        a = b; b = t;                  /* 往前推一格 */
    }
    return a;
}

int main(void) {
    long f = fib(10);          /* 先算完再印：printf 參數的求值順序沒有規定 */
    printf("fib(10) = %ld，呼叫了 %d 次\n", f, calls);         /* 55，177 次 */
    printf("fib_nr(10) = %ld\n", fib_nr(10));                  /* 55 */
    return 0;
}
```

### 河內塔 {#alg-hanoi}

**想法**：要把 $n$ 個從 src 搬到 dst：先把上面 $n-1$ 個搬到 mid，再搬最大的，再把 $n-1$ 個從 mid 搬到 dst。

**寫程式要注意**：

- 參數是「個數 + 三根柱子的角色」：`hanoi(n, src, mid, dst)`。遞迴時**柱子的角色互換**：第一次 `hanoi(n-1, src, dst, mid)`、第二次 `hanoi(n-1, mid, src, dst)`。
- 終止條件：$n = 1$ 時直接搬，不再遞迴。
- 用 `static int step` 計步數：`static` 區域變數在多次呼叫之間會保留數值。
- 總步數 $2^n - 1$。

原章節：[[ch5-recursion#recursive-hanoi|列印河內塔的搬移過程]]、[[ch4-stack-queue#hanoi|河內塔]]

#### C 程式 {#alg-hanoi-code .fold}

```c
#include <stdio.h>

void hanoi(int n, char src, char mid, char dst) {
    static int step = 0;
    if (n > 1) hanoi(n - 1, src, dst, mid);   /* 上面 n-1 個先移到中間柱 */
    printf("步驟 %d：將 %d 號圓盤從 %c 柱搬到 %c 柱\n", ++step, n, src, dst);
    if (n > 1) hanoi(n - 1, mid, src, dst);   /* 再把 n-1 個移到目的柱 */
}

int main(void) {
    hanoi(3, 'a', 'b', 'c');
    /* 7 步：1 a→c、2 a→b、1 c→b、3 a→c、1 b→a、2 b→c、1 a→c */
    return 0;
}
```

### 輾轉相除法求 GCD {#alg-gcd}

**想法**：$\gcd(a, b) = \gcd(b, a \bmod b)$，一直做到能整除為止。

**寫程式要注意**：

- 遞迴版終止條件：`a % b == 0` 時答案是 `b`。
- 非遞迴版：`while (b != 0) { r = a % b; a = b; b = r; }`，結束時答案在 `a`。三行的順序不能換（要先算 `r` 再覆蓋 `a`、`b`）。
- `a` 比 `b` 小也沒關係：第一輪 `a % b == a`，兩者自動對調。
- 這是**尾端遞迴**（遞迴呼叫是最後一步），很容易改成迴圈。

原章節：[[ch5-recursion#recursive-gcd|輾轉相除法求 GCD]]

#### C 程式 {#alg-gcd-code .fold}

```c
#include <stdio.h>

int gcd(int a, int b) {           /* 遞迴 */
    if (a % b == 0) return b;
    return gcd(b, a % b);
}

int gcd_nr(int a, int b) {        /* 非遞迴 */
    while (b != 0) { int r = a % b; a = b; b = r; }
    return a;
}

int main(void) {
    printf("%d %d %d\n", gcd(48, 18), gcd_nr(48, 18), gcd(18, 48));   /* 6 6 6 */
    return 0;
}
```

### n 筆資料的所有排列 {#alg-permutation}

**想法**：第 $k$ 個位置輪流讓每個還沒用過的元素坐，剩下的位置遞迴排；排完換回原樣再試下一個。

**寫程式要注意**：

- `perm(d, k, n)` 意思是「`d[0..k-1]` 已固定，排 `d[k..n-1]`」。
- 終止條件：`k == n-1`（只剩最後一個位置，不用選）就印出。
- `for (i = k; i < n; i++)`：交換 `d[k]`、`d[i]` → 遞迴 `perm(d, k+1, n)` → **再換回來**。少了換回來，陣列順序會亂掉，結果有重複。
- `swap` 要傳位址 `swap(&d[k], &d[i])`，傳值改不到陣列。
- 共 $n!$ 種排列。

原章節：[[ch5-recursion#recursive-permutation|n 筆資料的所有排列]]

#### C 程式 {#alg-permutation-code .fold}

```c
#include <stdio.h>

void swap(char *a, char *b) { char t = *a; *a = *b; *b = t; }

void print(const char d[], int n) {
    for (int i = 0; i < n; i++) printf("%c", d[i]);
    printf(" ");
}

void perm(char d[], int k, int n) {         /* 排 d[k..n-1] */
    if (k == n - 1) { print(d, n); return; }
    for (int i = k; i < n; i++) {
        swap(&d[k], &d[i]);                 /* 讓 d[i] 坐第 k 位 */
        perm(d, k + 1, n);
        swap(&d[k], &d[i]);                 /* 換回來 */
    }
}

int main(void) {
    char d[] = {'a', 'b', 'c'};
    perm(d, 0, 3);                          /* abc acb bac bca cba cab */
    printf("\n");
    return 0;
}
```

## 樹（第 6 章） {#trees}

### 二元樹的追蹤 {#alg-traversal}

**想法**：前序（自己 → 左 → 右）、中序（左 → 自己 → 右）、後序（左 → 右 → 自己）。三種只差「印自己」那行放在哪。

**寫程式要注意**：

- 節點：`struct tnode { struct tnode *l_child; char data; struct tnode *r_child; };`。
- 遞迴的終止條件是 `p == NULL`（空樹什麼都不做），用 `if (p != NULL) { … }` 包起來。
- 三種追蹤的程式完全一樣，只是 `printf` 那行在兩個遞迴呼叫的前、中、後。
- 對運算式樹做三種追蹤，剛好得到前置、中置、後置式。
- 每個節點拜訪一次，$O(n)$；遞迴深度是樹高。

原章節：[[ch6-tree#traversal|二元樹的追蹤]]、[[ch6-tree#expression-tree|運算式樹]]

#### C 程式 {#alg-traversal-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct tnode {
    struct tnode *l_child;
    char data;
    struct tnode *r_child;
};

struct tnode *mk(char data, struct tnode *l, struct tnode *r) {
    struct tnode *p = (struct tnode *)malloc(sizeof(struct tnode));
    p->data = data; p->l_child = l; p->r_child = r;
    return p;
}

void preorder(struct tnode *p) {
    if (p != NULL) { printf("%c ", p->data); preorder(p->l_child); preorder(p->r_child); }
}
void inorder(struct tnode *p) {
    if (p != NULL) { inorder(p->l_child); printf("%c ", p->data); inorder(p->r_child); }
}
void postorder(struct tnode *p) {
    if (p != NULL) { postorder(p->l_child); postorder(p->r_child); printf("%c ", p->data); }
}

int main(void) {
    /* ((A-B)+(C*(D-E)/F)) 的運算式樹 */
    struct tnode *root =
        mk('+', mk('-', mk('A', NULL, NULL), mk('B', NULL, NULL)),
                mk('/', mk('*', mk('C', NULL, NULL),
                                mk('-', mk('D', NULL, NULL), mk('E', NULL, NULL))),
                        mk('F', NULL, NULL)));
    preorder(root);  printf("\n");   /* + - A B / * C - D E F */
    inorder(root);   printf("\n");   /* A - B + C * D - E / F */
    postorder(root); printf("\n");   /* A B - C D E - * F / + */
    return 0;
}
```

### 二元樹的一維陣列表示法 {#alg-tree-array}

**想法**：把樹當成完滿二元樹由上到下、由左到右編號 1, 2, 3…，節點 $i$ 的左子在 $2i$、右子在 $2i+1$、父節點在 $\lfloor i/2 \rfloor$。

**寫程式要注意**：

- 陣列**從索引 1 開始用**（第 0 格空著），公式才會是 $2i$、$2i+1$。從 0 開始的話要改成 $2i+1$、$2i+2$、$\lfloor (i-1)/2 \rfloor$。
- 沒有節點的位置要放一個「空」記號（例如 `'\0'`）。
- 遞迴追蹤時，終止條件從 `p == NULL` 變成「`i` 超出陣列 **或** 這格是空的」，而且 `i > n` 要**先**檢查，才不會讀到陣列外面。
- 陣列大小：深度 $k$ 要開 $2^k - 1$ 格（加上不用的第 0 格）。

原章節：[[ch6-tree#binary-tree-array|二元樹的一維陣列表示法]]、[[ch6-exercises#q-array-repr|第 6 章習題：二元樹的陣列表示]]

#### C 程式 {#alg-tree-array-code .fold}

```c
#include <stdio.h>
#define N 7                   /* 深度 3：2^3 - 1 = 7 格 */

char tree[N + 1] = {'\0', 'A', 'B', 'C', 'D', '\0', 'E', '\0'};  /* 第 0 格不用 */

int left(int i)   { return 2 * i; }
int right(int i)  { return 2 * i + 1; }
int parent(int i) { return i / 2; }

void preorder(int i) {
    if (i > N || tree[i] == '\0') return;     /* 超出範圍或空位 */
    printf("%c ", tree[i]);
    preorder(left(i));
    preorder(right(i));
}

int main(void) {
    /*      A(1)
           /    \
         B(2)   C(3)
         /      /
       D(4)   E(6)       第 5、7 格是空位 */
    printf("B 的右子 %c、C 的左子 %c、E 的父 %c\n",
           tree[right(2)] ? tree[right(2)] : '-',
           tree[left(3)], tree[parent(6)]);     /* B 的右子 -、C 的左子 E、E 的父 C */
    preorder(1);                                /* A B D C E */
    printf("\n");
    return 0;
}
```

### 由前序與中序重建二元樹 {#alg-rebuild-tree}

**想法**：前序第一個是樹根（後序則是最後一個）；在中序找到樹根，左邊全是左子樹、右邊全是右子樹，左右各自遞迴。

**寫程式要注意**：

- 函數參數用「起點 + 長度」描述目前這棵子樹在兩個字串中的範圍：`build(pre, in, n)`，`pre`、`in` 是指向子字串開頭的指標。
- 在中序找到樹根的位置 `k`：左子樹有 `k` 個、右子樹有 `n-k-1` 個。
- 前序版：左子樹是 `build(pre+1, in, k)`，右子樹是 `build(pre+1+k, in+k+1, n-k-1)`。
- 後序版：樹根是 `post[n-1]`，左子樹 `build(post, in, k)`，右子樹 `build(post+k, in+k+1, n-k-1)`。
- 終止條件 `n == 0` 回傳 `NULL`。
- 只給前序 + 後序無法唯一重建。

原章節：[[ch6-tree#rebuild-tree|由追蹤結果重建二元樹]]、[[ch6-exercises#q-rebuild-pre-in|第 6 章習題：前序加中序重建]]

#### C 程式 {#alg-rebuild-tree-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct tnode { struct tnode *l_child; char data; struct tnode *r_child; };

struct tnode *mk(char data) {
    struct tnode *p = (struct tnode *)malloc(sizeof(struct tnode));
    p->data = data; p->l_child = p->r_child = NULL;
    return p;
}

int find(const char *in, int n, char c) {
    for (int k = 0; k < n; k++) if (in[k] == c) return k;
    return -1;
}

struct tnode *build_pre_in(const char *pre, const char *in, int n) {
    if (n == 0) return NULL;
    struct tnode *root = mk(pre[0]);                   /* 前序第一個是樹根 */
    int k = find(in, n, pre[0]);                       /* 左子樹有 k 個 */
    root->l_child = build_pre_in(pre + 1, in, k);
    root->r_child = build_pre_in(pre + 1 + k, in + k + 1, n - k - 1);
    return root;
}

struct tnode *build_post_in(const char *post, const char *in, int n) {
    if (n == 0) return NULL;
    struct tnode *root = mk(post[n - 1]);              /* 後序最後一個是樹根 */
    int k = find(in, n, post[n - 1]);
    root->l_child = build_post_in(post, in, k);
    root->r_child = build_post_in(post + k, in + k + 1, n - k - 1);
    return root;
}

void preorder(struct tnode *p)  { if (p) { printf("%c", p->data); preorder(p->l_child); preorder(p->r_child); } }
void postorder(struct tnode *p) { if (p) { postorder(p->l_child); postorder(p->r_child); printf("%c", p->data); } }

int main(void) {
    const char *pre = "ABDECF", *in = "DBEAFC";
    struct tnode *t = build_pre_in(pre, in, (int)strlen(pre));
    postorder(t); printf("\n");                        /* DEBFCA */

    struct tnode *u = build_post_in("DEBFCA", in, 6);
    preorder(u); printf("\n");                         /* ABDECF */
    return 0;
}
```

### 引線二元樹 {#alg-threaded-tree}

**想法**：把原本空著的 `NULL` 指標改成指向中序的前一個（左引線）或下一個（右引線），中序追蹤就不用堆疊也不用遞迴。

**寫程式要注意**：

- 每個節點多兩個旗標：`l_flag`、`r_flag` 為 1 表示真的子樹、為 0 表示引線。
- 課本用一個**串列首** `head`：`head->l_child` 指樹根，最左和最右節點的引線都指回 `head`，追蹤繞回 `head` 就結束。
- 找中序後繼 `insuc(Y)`：`r_flag == 0` 時引線就是答案；否則進右子樹，**沿著 `l_flag == 1` 一路往左走到底**。
- 不用堆疊的中序追蹤：從 `head` 開始一直 `p = insuc(p)`，回到 `head` 就停。
- 插入 `Y` 成為 `X` 的右子：Y 先接手 X 原本的右邊（連旗標），Y 的左引線指回 X，X 的右邊改成 Y；若 Y 有右子樹，Y 的後繼原本的左引線要改指 Y。

原章節：[[ch6-tree#threaded-binary-tree|引線二元樹]]、[[ch6-tree#thread-successor-insert|引線二元樹的後繼與插入]]

#### C 程式 {#alg-threaded-tree-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct ttnode {
    int l_flag;                    /* 1 = 左子樹，0 = 左引線 */
    struct ttnode *l_child;
    char data;
    struct ttnode *r_child;
    int r_flag;                    /* 1 = 右子樹，0 = 右引線 */
};

struct ttnode *mk(char data, struct ttnode *l, struct ttnode *r) {
    struct ttnode *p = (struct ttnode *)malloc(sizeof(struct ttnode));
    p->data = data; p->l_child = l; p->r_child = r;
    p->l_flag = p->r_flag = 1;
    return p;
}

/* 把一般二元樹接上引線：中序走一遍，prev 是中序的前一個 */
struct ttnode *head, *prev;
void thread(struct ttnode *p) {
    if (p == NULL) return;
    thread(p->l_child);
    if (p->l_child == NULL) { p->l_flag = 0; p->l_child = prev; }        /* 左引線 */
    if (prev != head && prev->r_child == NULL) { prev->r_flag = 0; prev->r_child = p; }
    prev = p;
    thread(p->r_child);                       /* 這時 r_child 還是原本的子樹或 NULL */
}

struct ttnode *make_threaded(struct ttnode *root) {
    head = mk('#', root, NULL);
    head->r_child = head;                     /* 串列首的右邊指自己 */
    prev = head;
    thread(root);
    prev->r_flag = 0; prev->r_child = head;   /* 最右節點的右引線指回 head */
    return head;
}

struct ttnode *insuc(struct ttnode *y) {
    struct ttnode *s = y->r_child;
    if (y->r_flag == 0) return s;             /* 右邊是引線，直接就是後繼 */
    while (s->l_flag == 1) s = s->l_child;    /* 否則到右子樹最左下 */
    return s;
}

void inorder_threaded(struct ttnode *h) {     /* 不用堆疊、不用遞迴 */
    for (struct ttnode *p = insuc(h); p != h; p = insuc(p))
        printf("%c ", p->data);
    printf("\n");
}

void insert_right(struct ttnode *x, struct ttnode *y) {   /* y 成為 x 的右子 */
    y->r_child = x->r_child; y->r_flag = x->r_flag;       /* y 接手 x 原本的右邊 */
    y->l_child = x;          y->l_flag = 0;               /* y 的左引線指回 x */
    x->r_child = y;          x->r_flag = 1;
    if (y->r_flag == 1) {                                  /* y 有右子樹 */
        struct ttnode *z = insuc(y);
        z->l_child = y;                                    /* 原本指 x 的左引線改指 y */
    }
}

int main(void) {
    /*      A
           / \
          B   C
         / \
        D   E      */
    struct ttnode *E = mk('E', NULL, NULL);
    struct ttnode *B = mk('B', mk('D', NULL, NULL), E);
    struct ttnode *A = mk('A', B, mk('C', NULL, NULL));
    struct ttnode *h = make_threaded(A);
    inorder_threaded(h);                      /* D B E A C */
    insert_right(B, mk('X', NULL, NULL));     /* X 插成 B 的右子，E 變 X 的右子樹 */
    inorder_threaded(h);                      /* D B X E A C */
    printf("E 的左引線指向 %c\n", E->l_child->data);   /* X */
    return 0;
}
```

### 二元搜尋樹 {#alg-bst}

**想法**：左子樹全部比自己小、右子樹全部大於或等於自己。搜尋和插入都是「比較小往左、比較大往右」。

**寫程式要注意**：

- 插入用遞迴最好寫：`root = insert(root, key);`，空的位置就是新節點的家，**函數要回傳（可能改變的）樹根**，呼叫端接回去。
- 課本規則：**相等放右邊**（`key < p->data` 往左，否則往右）。
- 搜尋可以用迴圈：`while (p != NULL && p->data != key)` 往左或往右走。
- 刪除分三種：
  - 樹葉 → 直接刪。
  - 一個子樹 → 父節點改接那個子樹（遞迴版直接回傳那個子樹）。
  - 兩個子樹 → 找**中序後繼**（右子樹一路往左到底），把它的值複製上來，再到右子樹刪掉那個後繼。
- 中序追蹤結果由小到大。速度看樹高：平衡時 $O(\log n)$，歪成一條線時 $O(n)$。

原章節：[[ch6-tree#bst|二元搜尋樹]]、[[ch6-tree#bst-delete|二元搜尋樹的刪除]]、[[ch6-exercises#q-bst-build|第 6 章習題：建立二元搜尋樹]]

#### C 程式 {#alg-bst-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct tnode { struct tnode *l_child; int data; struct tnode *r_child; };

struct tnode *insert(struct tnode *p, int key) {
    if (p == NULL) {                                   /* 空位就是新家 */
        p = (struct tnode *)malloc(sizeof(struct tnode));
        p->data = key; p->l_child = p->r_child = NULL;
    } else if (key < p->data) p->l_child = insert(p->l_child, key);
    else                      p->r_child = insert(p->r_child, key);   /* 相等放右 */
    return p;
}

struct tnode *search(struct tnode *p, int key) {
    while (p != NULL && p->data != key)
        p = (key < p->data) ? p->l_child : p->r_child;
    return p;                                          /* 找不到是 NULL */
}

struct tnode *delete_key(struct tnode *p, int key) {
    if (p == NULL) return NULL;
    if (key < p->data)      p->l_child = delete_key(p->l_child, key);
    else if (key > p->data) p->r_child = delete_key(p->r_child, key);
    else {
        if (p->l_child == NULL || p->r_child == NULL) {   /* 樹葉或一個子樹 */
            struct tnode *child = p->l_child ? p->l_child : p->r_child;
            free(p);
            return child;                              /* 父節點改接這個子樹 */
        }
        struct tnode *s = p->r_child;                  /* 中序後繼：右子樹最左 */
        while (s->l_child != NULL) s = s->l_child;
        p->data = s->data;
        p->r_child = delete_key(p->r_child, s->data);
    }
    return p;
}

void inorder(struct tnode *p) {
    if (p) { inorder(p->l_child); printf("%d ", p->data); inorder(p->r_child); }
}

int main(void) {
    int d[] = {31, 76, 11, 47, 20, 55, 33, 120};
    struct tnode *root = NULL;
    for (int i = 0; i < 8; i++) root = insert(root, d[i]);
    inorder(root); printf("\n");                       /* 11 20 31 33 47 55 76 120 */
    printf("找 55：%s\n", search(root, 55) ? "有" : "沒有");
    root = delete_key(root, 11);                       /* 只有右子樹 */
    root = delete_key(root, 31);                       /* 兩個子樹：33 上來 */
    printf("新樹根 %d\n", root->data);                 /* 33 */
    inorder(root); printf("\n");                       /* 20 33 47 55 76 120 */
    return 0;
}
```

### AVL 樹的旋轉 {#alg-avl}

**想法**：每次插入後檢查平衡因子 $BF$ = 左高 − 右高，出現 ±2 就旋轉。LL 右旋、RR 左旋、LR 先左後右、RL 先右後左。

**寫程式要注意**：

- 節點多存一個 `height`；`NULL` 的高度算 0，樹葉是 1。
- 右旋（LL）：`a` 的左子 `b` 升上來，**`b` 原本的右子樹改掛成 `a` 的左子樹**，`b->r_child = a`。左旋鏡射。
- 旋轉後要**先更新下面那個（`a`）再更新上面那個（`b`）**的高度，因為上面的高度靠下面算。
- 遞迴插入回來的路上，每一層：更新高度 → 算 BF → 看是哪一型：
  - BF = 2 且新值 < 左子 → LL；BF = 2 且新值 > 左子 → LR（先對左子左旋）。
  - BF = −2 且新值 > 右子 → RR；BF = −2 且新值 < 右子 → RL（先對右子右旋）。
- 旋轉後回傳新的子樹根，讓上一層接回去。

原章節：[[ch6-tree#avl-tree|AVL 樹]]、[[ch6-tree#ex-avl-rotations|例子：RR、LR、RL]]

#### C 程式 {#alg-avl-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct anode { struct anode *l_child; int data; int height; struct anode *r_child; };

int h(struct anode *p)   { return p ? p->height : 0; }
int max(int a, int b)    { return a > b ? a : b; }
void update(struct anode *p) { p->height = 1 + max(h(p->l_child), h(p->r_child)); }
int bf(struct anode *p)  { return h(p->l_child) - h(p->r_child); }

struct anode *rotate_right(struct anode *a) {      /* LL */
    struct anode *b = a->l_child;
    a->l_child = b->r_child;                       /* b 的右子樹改掛到 a 的左邊 */
    b->r_child = a;
    update(a); update(b);                          /* 先下後上 */
    return b;
}

struct anode *rotate_left(struct anode *a) {       /* RR */
    struct anode *b = a->r_child;
    a->r_child = b->l_child;
    b->l_child = a;
    update(a); update(b);
    return b;
}

struct anode *insert(struct anode *p, int key) {
    if (p == NULL) {
        p = (struct anode *)malloc(sizeof(struct anode));
        p->data = key; p->height = 1; p->l_child = p->r_child = NULL;
        return p;
    }
    if (key < p->data) p->l_child = insert(p->l_child, key);
    else               p->r_child = insert(p->r_child, key);
    update(p);
    if (bf(p) == 2) {
        if (key < p->l_child->data) return rotate_right(p);        /* LL */
        p->l_child = rotate_left(p->l_child);                      /* LR */
        return rotate_right(p);
    }
    if (bf(p) == -2) {
        if (key >= p->r_child->data) return rotate_left(p);        /* RR */
        p->r_child = rotate_right(p->r_child);                     /* RL */
        return rotate_left(p);
    }
    return p;
}

void preorder(struct anode *p) {
    if (p) { printf("%d ", p->data); preorder(p->l_child); preorder(p->r_child); }
}

struct anode *build(const int d[], int n) {
    struct anode *root = NULL;
    for (int i = 0; i < n; i++) root = insert(root, d[i]);
    return root;
}

int main(void) {
    int ll[] = {66, 36, 75, 22, 45, 16};
    int rr[] = {36, 24, 60, 55, 88, 92};
    int lr[] = {88, 60, 95, 46, 68, 93, 98, 22, 55, 62, 78, 64};
    int rl[] = {36, 60, 55};
    preorder(build(ll, 6));  printf("\n");   /* 36 22 16 66 45 75 */
    preorder(build(rr, 6));  printf("\n");   /* 60 36 24 55 88 92 */
    preorder(build(lr, 12)); printf("\n");   /* 68 60 46 22 55 62 64 88 78 95 93 98 */
    preorder(build(rl, 3));  printf("\n");   /* 55 36 60 */
    return 0;
}
```

### B 樹的搜尋 {#alg-b-tree-search}

**想法**：$m$ 階 B 樹的每個節點最多放 $m-1$ 個排好序的鍵值和 $m$ 個子樹指標。搜尋時在節點裡找到第一個「不小於 $k$」的鍵值，相等就找到，否則往它左邊那個子樹走。

**寫程式要注意**：

- 節點：`n`（目前幾個鍵值）、`key[m-1]`、`child[m]`。`child[i]` 裡的鍵值都介於 `key[i-1]` 和 `key[i]` 之間。
- 節點內用迴圈找位置：`while (i < p->n && k > p->key[i]) i++;`，然後判斷 `key[i] == k`（先確認 `i < p->n`）。
- 沒找到就 `p = p->child[i]`，走到 `NULL` 表示不存在。
- **插入（分裂）和刪除（借位、合併）的程式很長**，考試幾乎都是手畫過程，這裡不附程式；規則見原章節。

原章節：[[ch6-tree#b-tree|B 樹]]、[[ch6-tree#b-tree-insert|B 樹的插入]]、[[ch6-tree#b-tree-delete|B 樹的刪除]]

#### C 程式 {#alg-b-tree-search-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>
#define M 3                       /* 3 階：每節點最多 2 個鍵值、3 個子樹 */

struct bnode {
    int n;
    int key[M - 1];
    struct bnode *child[M];
};

struct bnode *mk(int n, int k0, int k1) {
    struct bnode *p = (struct bnode *)calloc(1, sizeof(struct bnode));  /* child 全為 NULL */
    p->n = n; p->key[0] = k0; p->key[1] = k1;
    return p;
}

int b_search(struct bnode *p, int k) {
    while (p != NULL) {
        int i = 0;
        while (i < p->n && k > p->key[i]) i++;     /* 第一個不小於 k 的鍵值 */
        if (i < p->n && p->key[i] == k) return 1;  /* 找到 */
        p = p->child[i];                           /* 往 key[i] 左邊的子樹 */
    }
    return 0;
}

int main(void) {
    /*        [30 60]
            /    |    \
        [10 20] [40] [70 80]   */
    struct bnode *root = mk(2, 30, 60);
    root->child[0] = mk(2, 10, 20);
    root->child[1] = mk(1, 40, 0);
    root->child[2] = mk(2, 70, 80);
    printf("%d %d %d\n", b_search(root, 40), b_search(root, 80), b_search(root, 50));  /* 1 1 0 */
    return 0;
}
```

### 互斥集合的尋找與聯集 {#alg-disjoint-sets}

**想法**：每個集合是一棵樹，用陣列 `parent[x]` 記每個元素的父節點，樹根的 `parent` 是 −1。兩個元素往上找到同一個樹根，就在同一個集合。

**寫程式要注意**：

- 不用指標，一個整數陣列就夠：字母可以用 `c - 'A'` 轉成索引。
- `find(x)`：`while (parent[x] != -1) x = parent[x];`，回傳樹根。
- `union_set(x, y)`：先各自 `find` 到樹根，**樹根不同**才把一個樹根的 `parent` 設成另一個樹根。直接改 `parent[x]` 會把 x 從原集合拆出來，是錯的。
- `union` 是 C 的保留字（聯合型別），函數名要換一個。
- 補充（課本未要求）：把小樹接到大樹下、尋找時順便讓路上節點直接指樹根，可以讓樹保持很矮。

原章節：[[ch6-tree#disjoint-sets|互斥集合]]

#### C 程式 {#alg-disjoint-sets-code .fold}

```c
#include <stdio.h>
#define N 11                          /* A..K */

int parent[N];

int find(int x) {
    while (parent[x] != -1) x = parent[x];
    return x;                         /* 樹根 */
}

void union_set(int x, int y) {
    int rx = find(x), ry = find(y);
    if (rx != ry) parent[ry] = rx;    /* y 的樹根接到 x 的樹根底下 */
}

int id(char c) { return c - 'A'; }

int main(void) {
    for (int i = 0; i < N; i++) parent[i] = -1;
    /* S1 = {A,B,C,D}、S2 = {E,F,G}、S3 = {H,I,J,K} */
    const char *s1 = "BCD", *s2 = "FG", *s3 = "IJK";
    for (int i = 0; s1[i]; i++) parent[id(s1[i])] = id('A');
    for (int i = 0; s2[i]; i++) parent[id(s2[i])] = id('E');
    for (int i = 0; s3[i]; i++) parent[id(s3[i])] = id('H');

    printf("%d\n", find(id('C')) == find(id('F')));   /* 0：不同集合 */
    union_set(id('A'), id('G'));                      /* S1 ∪ S2：E 接到 A 底下 */
    printf("%d\n", find(id('C')) == find(id('F')));   /* 1：同一個集合 */
    printf("F 的樹根 %c\n", 'A' + find(id('F')));     /* A */
    return 0;
}
```

### 霍夫曼樹與編碼 {#alg-huffman}

**想法**：每次挑出次數最少的兩棵樹，接到一個新節點底下（次數相加），重複到只剩一棵。從樹根走到樹葉，右分支記 0、左分支記 1，就是那個字元的編碼。

**寫程式要注意**：

- 用一個「目前還沒合併的樹」的指標陣列 `forest[]`，每回合掃兩遍找最小和次小（$n$ 很小時最簡單；C++ 可改用 `std::priority_queue`）。
- 合併後把新節點放回最小那格，次小那格用陣列最後一個補上，`cnt` 減 1。
- 編碼用遞迴：帶著一個字元陣列 `code` 和目前深度 `depth`，往左寫 `'1'`、往右寫 `'0'`，到樹葉時補 `'\0'` 印出。
- 同次數時左右擺法可以不同，所以**編碼本身不唯一，但每個字元的編碼長度和平均長度一樣**。
- 樹葉的判斷：左右子都是 `NULL`。

原章節：[[ch6-tree#huffman|霍夫曼樹]]

#### C 程式 {#alg-huffman-code .fold}

```c
#include <stdio.h>
#include <stdlib.h>

struct hnode {
    char ch;
    int freq;
    struct hnode *l_child, *r_child;
};

struct hnode *mk(char ch, int freq, struct hnode *l, struct hnode *r) {
    struct hnode *p = (struct hnode *)malloc(sizeof(struct hnode));
    p->ch = ch; p->freq = freq; p->l_child = l; p->r_child = r;
    return p;
}

struct hnode *huffman(struct hnode *forest[], int cnt) {
    while (cnt > 1) {
        int a = 0, b = 1;                              /* a 最小、b 次小 */
        if (forest[b]->freq < forest[a]->freq) { a = 1; b = 0; }
        for (int i = 2; i < cnt; i++) {
            if (forest[i]->freq < forest[a]->freq) { b = a; a = i; }
            else if (forest[i]->freq < forest[b]->freq) b = i;
        }
        struct hnode *x = mk('*', forest[a]->freq + forest[b]->freq,
                             forest[b], forest[a]);    /* 左：次小，右：最小 */
        forest[a] = x;                                 /* 新樹放回最小那格 */
        forest[b] = forest[--cnt];                     /* 最後一棵補到次小那格 */
    }
    return forest[0];
}

void print_codes(struct hnode *p, char code[], int depth) {
    if (p->l_child == NULL && p->r_child == NULL) {    /* 樹葉 */
        code[depth] = '\0';
        printf("%c：%s（長度 %d）\n", p->ch, code, depth);
        return;
    }
    code[depth] = '1'; print_codes(p->l_child, code, depth + 1);   /* 左 1 */
    code[depth] = '0'; print_codes(p->r_child, code, depth + 1);   /* 右 0 */
}

int main(void) {
    struct hnode *forest[] = {mk('h', 1, NULL, NULL), mk('y', 1, NULL, NULL),
                              mk('a', 2, NULL, NULL), mk('p', 4, NULL, NULL)};
    char code[16];
    print_codes(huffman(forest, 4), code, 0);
    /* p 長度 1、a 長度 2、h 和 y 長度 3（0/1 怎麼排可能和課本不同） */
    return 0;
}
```
