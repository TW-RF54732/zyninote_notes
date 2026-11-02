---
title: 第 3 章 程度考題
summary: 第三章程度考題詳解：雜音邊界的計算方式，TTL 74LS 推動 74F 與 74LS 推動 74LS 的扇出計算，以及用 pMOS 並聯、nMOS 串聯設計 CMOS NAND 開關邏輯電路
order: 3.5
tags: [習題]
---

題目來源：[[_pdf/第3章程度考題(1).pdf|第 3 章程度考題]]。概念說明見 [[ch3-digital-ic#ch3-map|第 3 章 數位積體電路]]。

## 雜音邊界的計算 {#q-noise-margin}

如何計算雜音邊界？

### 詳解 {#q-noise-margin-solution .fold}

$$
NM_H = V_{OH} - V_{IH} \qquad NM_L = V_{IL} - V_{OL}
$$

- **高電位雜音邊界** $NM_H$：前一級輸出 1 的最低保證電壓 $V_{OH}$，與下一級判為 1 的最低電壓 $V_{IH}$ 的差。
- **低電位雜音邊界** $NM_L$：下一級判為 0 的最高電壓 $V_{IL}$，與前一級輸出 0 的最高保證電壓 $V_{OL}$ 的差。

注意事項：雜音邊界永遠是「**輸出**參數與**輸入**參數相減」，而且算出來要是正值；兩者中較小的那個決定電路的抗雜音能力。見 [[ch3-digital-ic#noise-margin|雜音邊界]]。

## 不同系列的扇出 {#q-fanout-mixed}

在 TTL 邏輯族中，一個 74LS 系列的邏輯閘可以推動幾個 74F 系列的邏輯閘？

- 74LS：$I_{OL} = 8$ mA；$I_{OH} = -0.4$ mA；$I_{IL} = -0.4$ mA；$I_{IH} = 20\ \mu$A
- 74F：$I_{OL} = 20$ mA；$I_{OH} = -1$ mA；$I_{IL} = -0.6$ mA；$I_{IH} = 20\ \mu$A

### 詳解 {#q-fanout-mixed-solution .fold}

驅動閘是 74LS，所以用 **74LS 的輸出電流**；負載是 74F，所以用 **74F 的輸入電流**：

$$
N_L = -\frac{I_{OL(\text{74LS})}}{I_{IL(\text{74F})}} = -\frac{8\text{ mA}}{-0.6\text{ mA}} = 13.3
\qquad
N_H = -\frac{I_{OH(\text{74LS})}}{I_{IH(\text{74F})}} = -\frac{-0.4\text{ mA}}{20\ \mu\text{A}} = 20
$$

扇出取較小者並無條件捨去：**13 個**。74F 的 $I_{OL}$、$I_{OH}$ 與 74LS 的 $I_{IL}$、$I_{IH}$ 用不到。見 [[ch3-digital-ic#fan-in-fan-out|扇入與扇出]]。

## 相同系列的扇出 {#q-fanout-same}

計算 TTL 74LS 系列對 74LS 系列的扇出數。電流特性：$I_{OL} = 8$ mA；$I_{OH} = -0.4$ mA；$I_{IL} = -0.4$ mA；$I_{IH} = 20\ \mu$A。

### 詳解 {#q-fanout-same-solution .fold}

$$
N_L = -\frac{8\text{ mA}}{-0.4\text{ mA}} = 20 \qquad N_H = -\frac{-0.4\text{ mA}}{20\ \mu\text{A}} = 20
$$

扇出為 **20**。

## 設計 CMOS NAND 開關電路 {#q-cmos-nand}

設計一個開關邏輯電路，執行 $f(x, y) = (xy)'$。

### 詳解 {#q-cmos-nand-solution .fold}

用 $f/f'$ 樣式：pMOS 網路實現 $f$ 接 $V_{DD}$，nMOS 網路實現 $f'$ 接地。見 [[ch3-digital-ic#switch-logic-design|開關邏輯設計原理]]。

1. $f = (xy)' = x' + y'$：OR 運算，而 pMOS 在輸入為 0 時導通（本身就提供 $x'$），所以**兩個 pMOS（閘極接 $x$、$y$）並聯**於 $V_{DD}$ 與輸出之間。
2. $f' = xy$：AND 運算，**兩個 nMOS（閘極接 $x$、$y$）串聯**於輸出與地之間。

| $x$ | $y$ | pMOS 網路 | nMOS 網路 | $f$ |
|---|---|---|---|---|
| 0 | 0 | 兩個都導通 | 都截止 | 1 |
| 0 | 1 | $Q_{1p}$ 導通 | $Q_{1n}$ 截止 | 1 |
| 1 | 0 | $Q_{2p}$ 導通 | $Q_{2n}$ 截止 | 1 |
| 1 | 1 | 都截止 | 兩個都導通 | 0 |

任何時刻只有一個網路接通，滿足「輸出始終接到 1 或 0、且不同時接到兩者」的規則。電路圖見 [[ch3-digital-ic#cmos-nand|CMOS NAND 閘]]。
