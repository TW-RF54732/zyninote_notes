---
title: 第 4 章 習題
summary: 第四章習題詳解：堆疊與佇列的基本操作、堆疊的應用實例、堆疊與佇列的差異，陣列實作堆疊、佇列、環狀佇列的滿／空判斷與加入刪除位置，陣列與串列實作比較，五題中置式轉後置式與後置式求值
order: 4.5
tags: [習題]
---

題目來源：[[_pdf/習題解答-ch04.pdf|習題解答 ch04]]。概念說明見 [[ch4-stack-queue#ch4-map|第 4 章 堆疊和佇列]]。

## 堆疊與佇列的基本操作 {#q-basic-ops}

實作堆疊、佇列時各須考慮哪些基本操作？

### 詳解 {#q-basic-ops-solution .fold}

| 堆疊 | 佇列 |
|---|---|
| 產生堆疊 | 產生佇列 |
| push：加入資料 | 加入資料（rear 端） |
| pop：取出資料 | 取出資料（front 端） |
| isFull：是否滿溢 | isFull：是否滿溢 |
| isEmpty：是否為空 | isEmpty：是否為空 |
| 銷毀堆疊 | 銷毀佇列 |

## 堆疊的應用 {#q-stack-uses}

列舉至少 5 個堆疊的應用。

### 詳解 {#q-stack-uses-solution .fold}

1. 副程式的呼叫與返回
2. 遞迴程式的呼叫與返回
3. 中置式轉後置式
4. 後置式求值
5. 字串反轉
6. 二元樹的前序、中序追蹤（非遞迴版）
7. 圖形的先深後廣（DFS）追蹤

## 堆疊與佇列的差異 {#q-stack-vs-queue}

比較堆疊與佇列在應用上的差異。

### 詳解 {#q-stack-vs-queue-solution .fold}

- 相同：都是**線性**資料結構。
- 堆疊：加入與刪除在**同一端**（頂端），先進後出。
- 佇列：加入與刪除在**兩端**，先進先出。

## 陣列實作的滿與空 {#q-full-empty}

以陣列 `[n]` 實作堆疊、佇列、環狀佇列時，如何判斷滿溢與空？環狀佇列加入、刪除的位置為何？

### 詳解 {#q-full-empty-solution .fold}

| | 初值 | 滿 | 空 |
|---|---|---|---|
| 堆疊 | `top = -1` | `top == n-1` | `top < 0` |
| 佇列 | `front = rear = -1` | `rear == n-1` | `front == rear` |
| 環狀佇列 | `front = rear = n-1` | `front == (rear+1) % n` | `front == rear` |

環狀佇列：

- 加入：未滿時 `rear = (rear+1) % n`，存入 `queue[rear]`
- 刪除：非空時 `front = (front+1) % n`，取出 `queue[front]`

見 [[ch4-stack-queue#circular-queue|環狀佇列]]。

## 實作方式比較 {#q-impl-compare}

比較以陣列、鏈結串列實作堆疊（佇列）；比較環狀佇列與一般佇列。

### 詳解 {#q-impl-compare-solution .fold}

見 [[ch4-stack-queue#array-vs-linked|陣列與鏈結串列實作比較]]、[[ch4-stack-queue#circular-queue|環狀佇列]] 的對照表。重點：

- 陣列：快、好寫，但大小固定，可能浪費或滿溢；一般佇列刪除後的空位不能再用。
- 串列：動態配置不易滿溢，但較慢、較難寫。
- 環狀佇列：空位可重複使用、不用搬資料，但最多只能放 $n-1$ 筆。

## 中置式轉後置式 {#q-infix-to-postfix}

1. `a+b/(c-d)*e`
2. `a+b-c`
3. `a/(b-c)*d`
4. `a^b-c/d+e`
5. `a-b*(c+d)^e`

### 詳解 {#q-infix-to-postfix-solution .fold}

先依優先順序加完整括號，再把運算子移到對應的右括號處。

| 中置 | 完整括號 | 後置 |
|---|---|---|
| `a+b/(c-d)*e` | `(a+((b/(c-d))*e))` | **`abcd-/e*+`** |
| `a+b-c` | `((a+b)-c)` | **`ab+c-`** |
| `a/(b-c)*d` | `((a/(b-c))*d)` | **`abc-/d*`** |
| `a^b-c/d+e` | `(((a^b)-(c/d))+e)` | **`ab^cd/-e+`** |
| `a-b*(c+d)^e` | `(a-(b*((c+d)^e)))` | **`abcd+e^*-`** |

見 [[ch4-stack-queue#paren-method|括號法轉換]]。

## 後置式求值 {#q-postfix-eval}

1. `abcd-/e*+`，$a=1,b=4,c=3,d=1,e=2$
2. `ab+c-`，$a=1,b=2,c=3$
3. `abc-/d*`，$a=18,b=3,c=1,d=9$
4. `ab^cd/-e+`，$a=2,b=3,c=10,d=5,e=1$
5. `abcd+e^*-`，$a=100,b=4,c=3,d=2,e=2$

### 詳解 {#q-postfix-eval-solution .fold}

運算元 push；遇到運算子 pop 兩個（先彈出的是右運算元）計算後 push。

1. $1 + 4/(3-1)\times2 = 1 + 2\times2 = $ **5**
2. $(1+2)-3 = $ **0**
3. $18/(3-1)\times9 = 9\times9 = $ **81**
4. $2^3 - 10/5 + 1 = 8-2+1 = $ **7**
5. $100 - 4\times(3+2)^2 = 100-100 = $ **0**

見 [[ch4-stack-queue#postfix-eval|後置式求值]]。
