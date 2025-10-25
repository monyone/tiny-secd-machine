# SECD Machine - TypeScript Implementation

TypeScriptで実装された教育的なSECDマシン: ラムダ計算の評価エンジン

## 概要

このプロジェクトは、**SECD (Stack, Environment, Control, Dump) マシン**のTypeScript実装です。SECDマシンは、関数型プログラミング言語、特にラムダ計算を評価するための抽象機械として、1964年にPeter Landinによって考案されました。

### なぜSECDマシンなのか?

- **教育的価値**: 関数型言語の評価戦略を理解する最良の手段の一つ
- **形式的**: ラムダ計算の操作的意味論を明確に定義
- **実用的**: 多くの関数型言語処理系の基礎となる設計パターン
- **シンプル**: わずか4つのコンポーネントで強力な計算モデルを実現

## SECDマシンとは

SECDマシンは、4つの主要なデータ構造を使用して式を評価します:

### S - Stack (スタック)

計算の中間結果を保持します。関数の引数や評価結果がこのスタックにプッシュされます。

例: `(λx.x) 42` を評価する際、`42`と`λx.x`がスタックに積まれます。

### E - Environment (環境)

変数と値のバインディング(束縛)を保持します。レキシカルスコープ(静的スコープ)を実現するための重要なコンポーネントです。

例: `x = 5` というバインディングは環境に `[(x, 5)]` として保存されます。

### C - Control (制御)

実行待ちの式のリストです。プログラムカウンタに相当し、次に何を評価するかを管理します。

例: `(f x) y` を評価する際、制御スタックには `[Ap, f, x, Ap, y]` のような命令列が積まれます。

### D - Dump (ダンプ)

関数呼び出し時の状態 (S, E, C) を保存します。関数から戻る際に状態を復元するために使用されます。

例: ネストした関数呼び出し `f (g x)` では、`f`の評価前に現在の状態がダンプに保存されます。

## アーキテクチャ

### プロジェクト構造

```
src/
├── index.mts          # メイン評価ループ (SECDマシンのコア)
├── expression.mts     # ラムダ計算の式の型定義
├── instruction.mts    # 実行時の値 (クロージャなど)
├── environment.mts    # 変数バインディングの環境
└── dump.mts          # 関数呼び出し時の状態保存
```

### 型システム

#### Expression (式)

```typescript
type Expression =
  | Variable        // 変数: x, y, z
  | Abstraction     // ラムダ抽象: λx.M
  | Application     // 関数適用: M N
  | Ap             // 内部的な適用命令
```

#### Instruction (命令/値)

```typescript
type State = Instruction[];

type Instruction =
  | Closure         // クロージャ (環境付きラムダ抽象)
  | Variable        // 評価されていない変数
```

#### Environment (環境)

```typescript
type Environment = [Variable, Instruction][];
```

変数と値のペアのリスト。新しいバインディングは末尾に追加され、検索は末尾から行われます (シャドーイングをサポート)。

#### Dump (ダンプ)

```typescript
type Dump = {
  state: State;
  env: Environment;
  code: Expression[];
};
```

関数呼び出し時の3つの状態を保存します。

## 実装の詳細

### 評価アルゴリズム

SECDマシンの評価ループは以下のように動作します:

```typescript
export const secd = (expr: Expression) => {
  let state: State = [];           // S: スタック
  let env: Environment = [];       // E: 環境
  let code: Expression[] = [expr]; // C: 制御
  let dump: Dump[] = [];           // D: ダンプ

  while (true) {
    // 制御スタックが空の場合
    if (code.length === 0) {
      if (dump.length === 0) {
        return state[0];  // 最終結果を返す
      }
      // ダンプから状態を復元
      const restore = dump.pop()!;
      state = [...restore.state, ...state];
      env = restore.env;
      code = restore.code;
    } else {
      // 次の式を取り出して評価
      const expr = code.pop()!;

      switch (expr.type) {
        case 'Abstraction': /* ... */
        case 'Variable': /* ... */
        case 'Application': /* ... */
        case 'Ap': /* ... */
      }
    }
  }
}
```

### 各命令の動作

#### 1. Abstraction (ラムダ抽象)

```typescript
case 'Abstraction':
  state.push(Closure.form(expr.parameter, expr.body, env));
  break;
```

動作:

- 現在の環境 `env` をキャプチャしてクロージャを生成
- クロージャをスタックにプッシュ
- これにより**レキシカルスコープ**が実現される

#### 2. Variable (変数)

```typescript
case 'Variable':
  state.push(
    env.findLast((e) => e[0].name === expr.name)?.[1]
    ?? Variable.from(expr.name)
  );
  break;
```

動作:

- 環境を末尾から検索 (最も新しいバインディングを優先)
- 見つかった場合: その値をスタックにプッシュ
- 見つからない場合: 自由変数としてそのままプッシュ

#### 3. Application (関数適用)

```typescript
case 'Application':
  code.push(Ap.from());
  code.push(expr.operator);
  code.push(expr.operand);
  break;
```

動作:

- 制御スタックに以下を順にプッシュ:
  1. `Ap`命令 (後で実行される)
  2. オペレータ (関数)
  3. オペランド (引数)
- スタックはLIFO (後入れ先出し) なので、評価順は:
  1. オペランド → 2. オペレータ → 3. Ap

#### 4. Ap (適用命令)

```typescript
case 'Ap':
  const inst1 = state.pop()!;  // オペランド
  const inst2 = state.pop()!;  // オペレータ

  if (inst1.type === 'Closure') {
    // 現在の状態をダンプに保存
    dump.push(Dump.from(state, env, code));

    // 新しい環境で関数本体を評価
    state = [];
    env = [...inst1.env, [inst1.parameter, inst2]];
    code = [inst1.body];
  } else {
    // クロージャでない場合は部分適用として文字列化
    state.push(Variable.from(`(${inst1} ${inst2})`));
  }
  break;
```

動作:

- スタックから関数と引数をポップ
- クロージャの場合:
  1. 現在の状態 (S, E, C) をダンプに保存
  2. クロージャの環境を拡張 (引数をバインド)
  3. 関数本体を評価
- それ以外: 部分適用として表示

### クロージャとレキシカルスコープ

このSECDマシンの重要な特徴は、**クロージャ**によるレキシカルスコープの実現です。

例:

```typescript
// (λx.λy.x) a
```

1. `λx.λy.x` が評価されると、現在の環境 (空) を含むクロージャ `C1` が生成される
2. `C1` に `a` を適用すると、環境 `[x = a]` で `λy.x` が評価される
3. `λy.x` が評価されると、環境 `[x = a]` を含むクロージャ `C2` が生成される
4. `C2` が評価されると、環境から `x` の値 (`a`) が正しく参照される

これにより、関数が定義された時点の環境が保持され、**レキシカルスコープ**が実現されます。

### 評価順序

このSECDマシンは**call-by-value** (値呼び) の評価戦略を採用しています:

- 関数適用 `M N` では、まず `N` を評価してから `M` を評価
- 関数本体は引数が値になってから評価される

**call-by-name** (名前呼び) や **call-by-need** (必要呼び) とは異なり、引数は常に関数に渡される前に評価されます。

---

## ライセンス

WTFPL - Do What The F*ck You Want To Public License

