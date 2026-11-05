---
title: 第 5 章 習題
summary: 第五章習題詳解：遞迴的定義、撰寫遞迴函數的考量、遞迴演算法應用，非遞迴版的 n 的 m 次方、n 階乘與 GCD，支援與不支援遞迴的程式語言，遞迴函數的優缺點，以及處理遞迴呼叫返回的資料結構
order: 5.5
tags: [習題]
---

題目來源：[[_pdf/習題解答-ch05.pdf|習題解答 ch05]]。概念說明見 [[ch5-recursion#ch5-map|第 5 章 遞迴]]。

## 遞迴的定義 {#q-definition}

試解釋「遞迴」，並說明撰寫遞迴函數須考量哪些因素。

### 詳解 {#q-definition-solution .fold}

處理程序在處理過程中又反覆執行該處理程序，稱為遞迴。

撰寫時考量：函數名稱、需要的引數與型態、呼叫自己時帶入的參數值、回傳值與如何在回傳時呼叫自己、終止條件與終止時的回傳值。見 [[ch5-recursion#recursion-tips|撰寫遞迴函數的訣竅]]。

## 遞迴的應用 {#q-applications}

舉出至少 3 個遞迴演算法的應用。

### 詳解 {#q-applications-solution .fold}

$n^m$、$n!$、費氏數列、河內塔、輾轉相除法求 GCD、列出所有排列。見 [[ch5-recursion#ch5-map|本章地圖]]。

## 非遞迴版本 {#q-iterative}

以非遞迴方式寫出：

1. $n$ 的 $m$ 次方
2. $n!$
3. 兩正整數的 GCD

### 詳解 {#q-iterative-solution .fold}

```c
long power_nr(long n, int m) {
    long r = 1;
    for (int i = 0; i < m; i++) r *= n;
    return r;
}

long factorial_nr(int n) {
    long r = 1;
    for (int i = 2; i <= n; i++) r *= i;
    return r;
}

int gcd_nr(int a, int b) {
    while (b != 0) { int r = a % b; a = b; b = r; }
    return a;
}
```

## 支援遞迴的語言 {#q-languages}

哪些程式語言提供遞迴呼叫？哪些沒有？

### 詳解 {#q-languages-solution .fold}

- 有：C、C++、Pascal、ALGOL、PL/I
- 沒有（早期版本）：COBOL、FORTRAN、BASIC

## 遞迴的優缺點 {#q-pros-cons}

就程式設計的觀點說明遞迴函數的優缺點；哪一種資料結構用來處理遞迴的呼叫和返回？

### 詳解 {#q-pros-cons-solution .fold}

- 優點：程式碼精簡。
- 缺點：呼叫與返回增加系統負擔、佔用較多記憶體，不一定提升效率；且不是所有問題都適合遞迴。
- 處理呼叫與返回的是**堆疊**。

見 [[ch5-recursion#recursion-pros-cons|遞迴的優缺點]]。
