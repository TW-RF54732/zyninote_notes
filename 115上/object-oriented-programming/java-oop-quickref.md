---
title: Java OOP 速查手冊
summary: Java 物件導向語法速查：類別與物件、static、建構子與 this、存取與非存取修飾詞、封裝（getter／setter）、package 與 import、繼承與 super、覆寫 vs 多載、sealed、多型與 instanceof 模式比對、內部／巢狀／匿名類別、抽象類別、介面、抽象類別 vs 介面、enum、record，以及 equals／hashCode／toString
order: 100
tags: [速查]
---

## 類別與物件 {#classes}

類別（class）是藍圖，物件（object）是用 `new` 依藍圖建立出來的實體。類別裡放**屬性**（field，物件的資料）與**方法**（method，物件的行為）。

```java
// Car.java
public class Car {
    // 屬性 (field / attribute)
    String brand;
    int speed = 0;

    // 方法
    void accelerate(int v) { speed += v; }

    // static：屬於類別，不需建立物件即可呼叫
    static void info() { System.out.println("我是車"); }
}

// Main.java
Car c = new Car();      // 建立物件
c.brand = "Toyota";     // 用「物件.屬性」存取
c.accelerate(30);       // 用「物件.方法()」呼叫
System.out.println(c.speed);  // 30
Car.info();                   // 透過類別名稱呼叫 static 方法
```

### static 成員 vs 實例成員 {#static-vs-instance}

| | 實例成員（不加 `static`） | 靜態成員（`static`） |
|---|---|---|
| 屬於 | 每個物件各自一份 | 整個類別共用一份 |
| 呼叫方式 | `物件.成員` | `類別名.成員` |
| 能否用 `this` | 可以 | 不行（沒有「目前物件」） |
| 能否直接存取實例成員 | 可以 | 不行，要先有物件 |

```java
class Counter {
    static int total = 0;   // 所有 Counter 共用
    int id;                 // 每個物件各自的編號
    Counter() { total++; id = total; }
}
new Counter(); new Counter();
Counter.total;              // 2
```

## 建構子與 this {#constructors}

建構子（constructor）在 `new` 時執行，用來初始化物件。規則：**與類別同名、沒有回傳型別**（連 `void` 都不寫）。沒寫任何建構子時，編譯器會自動提供一個無參數建構子；只要自己寫了任何一個，就不再自動提供。

```java
public class Person {
    String name;
    int age;

    // 無參數建構子
    public Person() {
        this("無名", 0);          // 呼叫另一個建構子（必須在第一行）
    }

    // 有參數建構子
    public Person(String name, int age) {
        this.name = name;         // this 指目前物件，區分欄位與參數
        this.age = age;
    }
}

Person p = new Person("Amy", 20);
```

### this 的三種用法 {#this-usage}

| 寫法 | 意義 |
|---|---|
| `this.name` | 目前物件的欄位（參數與欄位同名時用來區分） |
| `this(...)` | 在建構子第一行呼叫同類別的另一個建構子 |
| `return this;` / 把 `this` 當參數傳出去 | 目前物件本身（例如做方法串接 `a.setX(1).setY(2)`） |

## 存取修飾詞 {#modifiers}

決定類別、欄位、方法**能被誰看到**。由寬到嚴：`public` > `protected` > （不寫，package-private）> `private`。

| 修飾詞 | 同類別 | 同套件 | 子類別 | 其他 |
|---|:-:|:-:|:-:|:-:|
| `public` | ✔ | ✔ | ✔ | ✔ |
| `protected` | ✔ | ✔ | ✔ | ✘ |
| （不寫，default） | ✔ | ✔ | ✘ | ✘ |
| `private` | ✔ | ✘ | ✘ | ✘ |

> 最外層（top-level）類別只能是 `public` 或不寫；`public class` 的名稱必須與檔名相同。

### 非存取修飾詞 {#non-access-modifiers}

Java 中不控制「誰看得到」、而是改變成員行為的修飾詞：

| 非存取修飾詞 | 意義 |
|---|---|
| `static` | 屬於類別而非物件 |
| `final` | 變數不可改、方法不可覆寫、類別不可繼承 |
| `abstract` | 抽象類別 / 抽象方法（無實作） |
| `synchronized` | 同一時間只允許一個執行緒進入 |
| `volatile` | 變數讀寫直接存取主記憶體（多執行緒可見性） |
| `transient` | 序列化時略過該欄位 |

## 封裝 Encapsulation {#encapsulation}

封裝：把欄位設成 `private`，外部只能透過 `public` 方法（getter／setter 或有意義的操作）存取，這樣類別可以檢查輸入、維持資料正確。

```java
public class Account {
    private double balance;           // 外部無法直接存取

    public double getBalance() { return balance; }   // getter：唯讀

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("金額需大於 0");
        balance += amount;            // 透過方法控管規則
    }
}

Account a = new Account();
a.deposit(100);
// a.balance = -999;   // 編譯錯誤：balance 是 private
```

命名慣例：`getXxx()`／`setXxx(v)`；`boolean` 欄位的 getter 用 `isXxx()`。

## 套件 Package 與 import {#packages}

套件（package）是類別的命名空間，對應到資料夾結構；`package` 宣告必須寫在檔案第一行。

```java
// 檔案位置：src/com/example/util/Tool.java
package com.example.util;

public class Tool { }
```

```java
import java.util.Scanner;       // 匯入單一類別
import java.util.*;             // 匯入整個套件（不含子套件）
import static java.lang.Math.*; // 匯入靜態成員，可直接寫 sqrt(4)
```

常用內建套件：`java.lang`（自動匯入：String、Math、System）、`java.util`（集合、Scanner）、`java.io` / `java.nio.file`（檔案）、`java.time`（日期）。

## 繼承 Inheritance 與 super {#inheritance}

子類別用 `extends` 繼承父類別的欄位與方法，並可覆寫（override）父類別的方法。Java 類別**只能單一繼承**；所有類別最終都繼承自 `Object`。

```java
class Animal {
    protected String name;
    Animal(String name) { this.name = name; }
    void sound() { System.out.println("..."); }
}

class Dog extends Animal {               // 只能單一繼承
    Dog(String name) { super(name); }    // 呼叫父類別建構子（第一行）

    @Override
    void sound() {
        super.sound();                    // 呼叫父類別版本
        System.out.println(name + "：汪");
    }
}

final class Cat extends Animal { ... }    // final 類別不能再被繼承
```

| 寫法 | 意義 |
|---|---|
| `super(...)` | 在子類別建構子第一行呼叫父類別建構子；沒寫時編譯器自動插入 `super()` |
| `super.方法()` | 呼叫父類別版本的方法 |
| `@Override` | 標示這是覆寫；方法名或參數寫錯時編譯會報錯 |

> 陷阱：父類別若只有帶參數的建構子，子類別建構子必須明確寫 `super(...)`，否則自動插入的 `super()` 找不到對應建構子而編譯錯誤。

### 覆寫 vs 多載 {#override-vs-overload}

| | 覆寫 Overriding | 多載 Overloading |
|---|---|---|
| 發生位置 | 子類別重新定義父類別的方法 | 同一類別內 |
| 方法名稱 | 相同 | 相同 |
| 參數列表 | **必須相同** | **必須不同**（數量或型別） |
| 回傳型別 | 相同（或其子型別） | 無關，不能只靠回傳型別區分 |
| 存取權限 | 不能比父類別更嚴格 | 無限制 |
| 決定時機 | 執行時（依實際物件，多型） | 編譯時（依參數型別） |

```java
static int plus(int x, int y)          { return x + y; }   // 多載
static double plus(double x, double y) { return x + y; }
plus(1, 2);      // 呼叫 int 版本
plus(1.5, 2.5);  // 呼叫 double 版本
```

`static`、`private`、`final` 方法都不能被覆寫。

### sealed 類別（Java 17+） {#sealed}

`sealed` 限定「只有列出的類別可以繼承我」，介於完全開放與 `final` 之間。被允許的子類別必須宣告為 `final`、`sealed` 或 `non-sealed`。

```java
sealed interface Shape permits Circle, Square { }
final class Circle implements Shape { }
non-sealed class Square implements Shape { }   // 允許 Square 再被任意繼承
```

## 多型 Polymorphism {#polymorphism}

父類別型別的變數可以指向子類別物件；呼叫被覆寫的方法時，執行的是**實際物件**的版本（動態繫結）。

以下沿用 `Animal`（有 `sound()` 印 `...`）與覆寫了 `sound()` 的子類別 `Dog extends Animal`：

```java
Animal[] zoo = { new Dog("小黑"), new Animal("某動物") };
for (Animal a : zoo) a.sound();   // Dog 印「小黑：汪」，Animal 印「...」

Animal a = new Dog("小白");        // 向上轉型（upcasting）：自動、安全
// a.fetch();                      // 編譯錯誤：變數型別 Animal 沒有 fetch()

// 向下轉型（downcasting）前先檢查
if (a instanceof Dog d) {          // Java 16+ 模式比對，直接得到 d
    d.sound();
}
Dog d2 = (Dog) a;                  // 傳統寫法：型別不對會丟 ClassCastException
```

> 記法：**能呼叫哪些方法看「變數型別」（編譯時）；實際執行哪個版本看「物件型別」（執行時）。**

## 內部類別 Inner Class {#inner}

類別裡面定義的類別。

```java
class Outer {
    int x = 10;

    class Inner {                 // 一般內部類別：可存取外部成員
        int getX() { return x; }
    }

    static class Nested {         // 靜態巢狀類別：不需外部物件
        int y = 5;
    }
}

Outer outer = new Outer();
Outer.Inner in = outer.new Inner();       // 需要先有外部物件
Outer.Nested ne = new Outer.Nested();     // 直接建立

// 匿名類別：臨時實作介面
Runnable r = new Runnable() {
    @Override public void run() { System.out.println("跑"); }
};
```

| 種類 | 需要外部物件？ | 能存取外部實例成員？ | 常見用途 |
|---|:-:|:-:|---|
| 內部類別 `class Inner` | 是 | 是 | 與外部物件緊密綁定的輔助物件 |
| 靜態巢狀類別 `static class` | 否 | 否 | 只是放在一起的相關類別（如 Builder） |
| 匿名類別 `new 介面() { ... }` | — | 是 | 一次性的介面實作（多半可改用 lambda） |

## 抽象類別 Abstract {#abstract}

`abstract class` 不能直接 `new`，用來當共同基底；其中的 `abstract` 方法沒有實作，**子類別必須實作**（否則子類別也得宣告為 abstract）。抽象類別仍可有欄位、建構子與一般方法。

```java
abstract class Shape {
    abstract double area();                  // 沒有實作，子類別必須實作
    void show() { System.out.println("面積=" + area()); } // 可有一般方法
}

class Circle extends Shape {
    double r;
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
}

// new Shape();  // 錯誤：抽象類別不能直接建立
new Circle(2).show();
```

## 介面 Interface {#interface}

介面定義「能做什麼」的契約，類別用 `implements` 實作，**一個類別可實作多個介面**。

```java
interface Flyable {
    int MAX_HEIGHT = 1000;              // 預設 public static final
    void fly();                         // 預設 public abstract
    default void land() {               // 預設方法（有實作，Java 8+）
        System.out.println("降落");
    }
    static void info() { System.out.println("飛行介面"); }
}

interface Swimmable { void swim(); }

class Duck implements Flyable, Swimmable {   // 可實作多個介面
    public void fly()  { System.out.println("鴨子飛"); }   // 必須 public
    public void swim() { System.out.println("鴨子游"); }
}
```

> 實作介面方法時一定要寫 `public`：介面方法預設是 public，覆寫不能縮小存取權限。

### 抽象類別 vs 介面 {#abstract-vs-interface}

| | 抽象類別 `abstract class` | 介面 `interface` |
|---|---|---|
| 繼承數量 | 單一 `extends` | 多個 `implements` |
| 欄位 | 任意 | 只有常數（`public static final`） |
| 建構子 | 可以有 | 沒有 |
| 方法 | 抽象方法＋一般方法 | 抽象方法＋`default`／`static`／`private` 方法 |
| 用途 | 「是一種」（is-a）共同基底 | 「能做什麼」（can-do）能力契約 |

## 列舉 Enum {#enum}

`enum` 是一組固定的常數，本身是類別，可以有欄位、建構子（只能是 private）與方法。

```java
enum Level {
    LOW(1), MEDIUM(5), HIGH(10);       // 常數，可帶值

    private final int value;
    Level(int value) { this.value = value; }
    int getValue() { return value; }
}

Level lv = Level.HIGH;
lv.getValue();            // 10
lv.name();                // "HIGH"
lv.ordinal();             // 2（位置，從 0 起算）
Level.valueOf("LOW");     // 字串 → enum
for (Level l : Level.values()) System.out.println(l);

switch (lv) {             // Java 14+ 箭頭語法
    case LOW -> System.out.println("低");
    case HIGH -> System.out.println("高");
    default -> System.out.println("中");
}
```

## record（Java 16+） {#record}

不可變的資料類別：宣告欄位後，自動產生建構子、存取方法、`equals`、`hashCode`、`toString`。欄位都是 `private final`，record 不能被繼承也不能繼承別的類別（但可以實作介面）。

```java
record Point(int x, int y) {
    Point {                                   // 精簡建構子：驗證用
        if (x < 0) throw new IllegalArgumentException();
    }
    double dist() { return Math.sqrt(x * x + y * y); }
}

Point p = new Point(3, 4);
p.x();          // 3（注意不是 getX()）
p.dist();       // 5.0
System.out.println(p); // Point[x=3, y=4]
```

## Object 的 equals、hashCode、toString {#object-methods}

所有類別都繼承自 `Object`，最常需要覆寫的三個方法：

| 方法 | 預設行為 | 覆寫後 |
|---|---|---|
| `toString()` | `類別名@雜湊碼`，例如 `Person@1b6d3586` | 印出有意義的內容 |
| `equals(Object o)` | 等同 `==`，比較是否同一個物件 | 比較內容 |
| `hashCode()` | 依物件位址產生 | 與 `equals` 一致：相等的物件必須有相同雜湊碼 |

```java
class Person {
    String name; int age;

    @Override public String toString() { return name + "(" + age + ")"; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Person p)) return false;
        return age == p.age && name.equals(p.name);
    }

    @Override public int hashCode() { return java.util.Objects.hash(name, age); }
}
```

> 覆寫 `equals` 就一定要一起覆寫 `hashCode`，否則物件放進 `HashSet` 或當 `HashMap` 的 key 時會出錯（看起來相等卻被當成不同）。`record` 已自動處理。
