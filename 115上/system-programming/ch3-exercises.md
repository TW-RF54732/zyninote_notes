---
title: 第 3 章 習題
summary: 第三章習題參考解答：用 CPU0 組合語言計算 a=b*3+c-d、交換暫存器 R1 與 R2 的內容（暫存器暫存法與 XOR 法），以及計算 1 到 20 的偶數和，附逐步追蹤與預期結果
order: 3.5
tags: [習題]
---

題目來源：[[_pdf/ch03習題.pdf|第三章習題]]。概念說明見 [[ch3-assembly#ch3-asm-map|第 3 章 CPU0 組合語言]]。

繳交規定：markdown 文件，命名「學號.zip」，內容包含程式碼、執行 Assembler 的結果、執行 Virtual Machine 的結果。以下解答是手算追蹤的參考，as0／vm0 的實際輸出要自己執行後截取（用法見 [[ch3-assembly#as0-vm0|as0 與 vm0]]）。

## 計算 a = b*3 + c - d {#q-expression}

（3.1-1）寫出一個 CPU0 組合語言程式，計算 `a = b*3 + c - d`；自行設定 b、c、d 的數值，先載入數值後再開始運算。

### 詳解 {#q-expression-solution .fold}

設 b = 5、c = 4、d = 2，預期 a = 5 × 3 + 4 − 2 = **17**（0x11）。

```asm
    LD   R2, b        ; R2 = b = 5
    LD   R3, c        ; R3 = c = 4
    LD   R4, d        ; R4 = d = 2
    LDI  R5, 3        ; R5 = 3
    MUL  R1, R2, R5   ; R1 = b * 3 = 15
    ADD  R1, R1, R3   ; R1 = 15 + 4 = 19
    SUB  R1, R1, R4   ; R1 = 19 - 2 = 17
    ST   R1, a        ; a = 17
    LD   R8, a        ; R8 = a，方便在 vm0 確認
    RET
a:  RESW 1
b:  WORD 5
c:  WORD 4
d:  WORD 2
```

注意事項：

- CPU0 的運算只在暫存器之間進行，常數 3 也要先用 `LDI` 放進暫存器，`MUL` 沒有立即值版本。
- 也可以不用乘法：`ADD R1, R2, R2` 再 `ADD R1, R1, R2`（b + b + b）。
- vm0 結束時應看到 R1 = R8 = 0x00000011 = 17。見 [[ch3-assembly#arithmetic|算術運算]]。

## 交換 R1 與 R2 {#q-swap}

（3.1-2）寫出一個 CPU0 組合語言 swap，將暫存器 R1 與 R2 的內容交換；先載入自行設定的數值，再執行交換。

### 詳解 {#q-swap-solution .fold}

**方法一：借用第三個暫存器**（R1 = 3、R2 = 8）

```asm
    LDI  R1, 3        ; R1 = 3
    LDI  R2, 8        ; R2 = 8
    MOV  R3, R1       ; R3 = 3（暫存 R1）
    MOV  R1, R2       ; R1 = 8
    MOV  R2, R3       ; R2 = 3
    RET
```

| 步驟 | R1 | R2 | R3 |
|---|---|---|---|
| 載入後 | 3 | 8 | 0 |
| `MOV R3, R1` | 3 | 8 | 3 |
| `MOV R1, R2` | 8 | 8 | 3 |
| `MOV R2, R3` | 8 | 3 | 3 |

**方法二：XOR 交換**，不需要額外暫存器：

```asm
    LDI  R1, 3
    LDI  R2, 8
    XOR  R1, R1, R2   ; R1 = 3 ^ 8 = 11
    XOR  R2, R1, R2   ; R2 = 11 ^ 8 = 3
    XOR  R1, R1, R2   ; R1 = 11 ^ 3 = 8
    RET
```

因為 $x \oplus y \oplus y = x$。注意如果直接 `MOV R1, R2` 再 `MOV R2, R1`，R1 原本的值會先被蓋掉，兩個都變成 8。見 [[ch2-cpu0-arch#logic-exec|邏輯指令的執行]]。

## 1 到 20 的偶數和 {#q-even-sum}

（3.1-3）使用 CPU0 組合語言撰寫一個程式，計算 1 到 20 的偶數和。

### 詳解 {#q-even-sum-solution .fold}

偶數和 = 2 + 4 + … + 20 = 2 × (1 + 2 + … + 10) = **110**（0x6E）。i 從 2 開始、每次加 2，就不必判斷奇偶：

```asm
    LDI  R1, 0        ; R1 = sum = 0
    LDI  R2, 2        ; R2 = i = 2
    LDI  R3, 20       ; R3 = 上限 20
    LDI  R4, 2        ; R4 = 步長 2
FOR:
    CMP  R2, R3       ; 比較 i 與 20
    JGT  EXIT         ; i > 20 就結束
    ADD  R1, R1, R2   ; sum += i
    ADD  R2, R2, R4   ; i += 2
    JMP  FOR
EXIT:
    ST   R1, sum      ; sum = 110
    LD   R8, sum      ; R8 = sum，方便在 vm0 確認
    RET
sum: WORD 0
```

| 圈數 | i（R2） | sum（R1） |
|---|---|---|
| 1 | 2 | 2 |
| 2 | 4 | 6 |
| 3 | 6 | 12 |
| … | … | … |
| 10 | 20 | 110 |
| 檢查 | 22 > 20 | 跳到 EXIT |

注意事項：

- 用 `LDI` 直接設定初值，避免 [[ch3-assembly#uninitialized-variable|未初始化變數]]的問題。
- 另一種寫法是 i 從 1 跑到 20，用 `AND R5, R2, R9`（R9 = 1）取最低位元判斷奇偶，最低位元為 0 才累加；比較麻煩，但示範了位元運算。
- vm0 結束時應看到 R1 = R8 = 0x0000006E = 110。迴圈結構見 [[ch3-assembly#for-loop|for 迴圈]]。
