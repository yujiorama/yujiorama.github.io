# Local Variable Type Inference: Style Guidelines

原文
https://openjdk.java.net/projects/amber/LVTIstyle.html

Stuart W. Marks
2018-03-22

## 初めに

Java SE 10 はローカル変数の型を推論する機能を導入しました。
以前は、全てのローカル変数の宣言の左側に明示的な型が必要でした。
型推論機能により、初期化子のあるローカル変数の宣言には、明示的な型の代わりに予約済みの型名`var`を使えるようになりました。
変数の型は初期化子の型から推論されるのです。

この機能について多くの議論が重ねられてきました。
簡潔な記述ができることを歓迎する人もいれば、重要な型情報を失うことが可読性を損ねることにつながることを危惧する人もいました。
どちらも正しい意見です。
冗長な情報を無くすことでソースコードを読みやすくできると同時に、役に立つ情報を省略して可読性を損ねてしまう場合もあるからです。
型推論機能に頼りきった不適切なソースコードが氾濫してしまうことを懸念する人もいます。
それもまた正しい意見ですが、同じように適切なソースコードが増える可能性もあるのです。
どんな機能も使い手が適切に判断しなければなりません。
なんらかの機能を利用するべきかどうかを判断するための画一的な決まりは存在しないのです。

ローカル変数の宣言が単独で使用されることはありません。
`var` の導入は周辺のソースコードに影響を与えるでしょうし、劇的な影響を与える可能性もあります。
このドキュメントの目的は、周辺のソースコードに`var`の宣言がもたらす影響を検討することです。
いくつかのトレードオフを説明し、効果的に`var`を使うためのガイドラインを提示します。

## 原則

### P1. ソースコードは書くより読むほうが重要

ソースコードを書く機会より、ソースコードを読む機会のほうがずっと多いです。
たいていの場合、私たちがソースコードを書くときは、全体的な文脈を頭の中に把握し、集中しています。ソースコードを読むときは、頻繁にコンテキストを切り替えながら、少なからず急いでいることでしょう。
特定の言語機能を使用するかどうか、また、どのように使用するかは、そのプログラムの作者ではなく「将来の読者」に与える影響を考慮して判断するべきです。
長すぎるより短いほうが望ましいのですが、短すぎるとプログラムを理解するのに役立つ情報が取り除かれてしまうかもしれません。
重要な課題は、分かりやすさを最大化する適切な大きさを特定することなのです。

私たちは、プログラムを入力したり編集したりするために必要なキーボードの打鍵量のことを特に考慮していません。
簡潔さはプログラムの作者にとって予期せぬ贈り物かもしれませんが、そこにこだわると本来の目的を見失ってしまいます。
プログラムの分かりやすさを改善することが重要です。

### P2. ソースコードの局所的な論理展開を明確にする

`var`の変数宣言を見つけたプログラムの読者が、その変数をどのように利用しているのかすぐに理解できるようにしなければなりません。
ソースコードのスニペットやパッチを読むだけで、容易に理解できるのが理想的です。
読者がソースコードのあちこちを見回らないと`var`の変数宣言を理解できないとしたら、おそらく間違った使い方をしています。
ソースコード自体に問題があることを示していると言えるでしょう。

### P3. ソースコードの可読性はIDEの使用を前提にするべきではありません

ソースコードを読み書きするためにIDEを使う場合は多いので、IDEのソースコード分析機能を過度に多用してしまうこともあるでしょう。
型宣言について言えば、IDEがポイントした変数の型を教えてくれるせいで、全ての変数宣言を`var`にしたくなってしまうかもしれません。

問題が2つあります。
1つ目は、IDEを使わずにソースコードを読む機会も多いことです。
ドキュメント中のスニペットや、Webブラウザで閲覧するソースコードリポジトリや、パッチファイルなど、ソースコードはIDEが使えないさまざまな場所に登場します。
単純にソースコードがやっていることを理解したいだけなのに、いちいちIDEへインポートしなければならないとしたら、それは逆効果です。

2つ目は、IDEでソースコードを読んでいるとしても、変数に関する詳細な情報が知りたければ、IDEを明示的に操作したり、問い合わせたりしなければならないことです。
具体的には、`var`で宣言した変数の型を確認するには、マウスポインタを変数の上に重ねて、情報がポップアップされるのを待たなければなりません。
少しだけとはいえ待ち時間が生じるため、ソースコードを読むフローを中断してしまいます。

ソースコードは自分自身を説明できるようにするべきです。
ツールの助けがなくても見たままで理解できるようにするべきなのです。

### P4. 明示的な型を使うときはトレードオフを考慮する

歴史的な経緯により、Javaでローカル変数を宣言するときは明示的な型が必要とされてきました。
明示的な型があることで助かる場合もありますが、たいして重要でない場合もありますし、邪魔になる場合もあります。
明示的な型のせいでソースコードが賑やかになり、重要な情報が埋もれてしまう場合があるのです。
明示的な型を無くせばソースコードはおとなしくなりますが、分かりやすさを損なうことが無い場合に限られます。
型だけがプログラムの読者に情報を伝える手段ではありません。
変数名や初期化子なども利用できます。
利用できる全てのチャンネルを考慮して、どれが使わなくていいチャンネルなのか判断するようにしましょう。

## ガイドライン

### G1. 変数名が役に立つ情報を伝えられるようにする

一般的ですが、`var`で変数宣言をするときはより重要なプラクティスです。
`var`で変数を宣言するときは、変数の意味や使い方を名前で表現することになります。
明示的な型を`var`に置き換えると、より良い名前を付けられるようになることが多いようです。


```java
    // ORIGINAL
    List<Customer> x = dbconn.executeQuery(query);
    
    // GOOD
    var custList = dbconn.executeQuery(query);
```

この例では、無意味な名前から変数の型を意識させる名前へ置き換えています。
`var`の変数宣言が名前に暗黙的な意味を持たせたのです。

論理的な帰結として、名前に変数の型を埋め込むようにしたのがいわゆる「ハンガリアン記法」です。
明示的な型と同じように役立つ場合もあるのですが、ソースコードを賑やかにしすぎてしまうでしょう。
前の例に登場する変数名 `custList` は、返り値が`List`であることを示唆しています。
たいした意味があるとは思えません。
明示的な型ではなく、”customers” のように変数の役割や性質を表す名前にしたほうがいいでしょう。


```java
    // ORIGINAL
    try (Stream<Customer> result = dbconn.executeQuery(query)) {
        return result.map(...)
                     .filter(...)
                     .findAny();
    }
    
    // GOOD
    try (var customers = dbconn.executeQuery(query)) {
        return customers.map(...)
                        .filter(...)
                        .findAny();
    }
```

### G2. ローカル変数のスコープは最小限にする

ローカル変数のスコープを狭くするのは一般的に良いとされているプラクティスです。
Effective Java(3rd edition) の Item 57 でも、`var` を使うときは特に注意するべきだと述べています。

次のコード例では、`add` メソッドへ最後の要素を表す特別な要素を渡しているのが分かります。


```java
    var items = new ArrayList<Item>(...);
    items.add(MUST_BE_PROCESSED_LAST);
    for (var item : items) ...
```

そして、重複する要素を取り除くため、プログラマーは `ArrayList` から `HashSet` へ変更しました。

```java
    var items = new HashSet<Item>(...);
    items.add(MUST_BE_PROCESSED_LAST);
    for (var item : items) ...
```

このソースコードには明らかなバグがあります。
`Set` はイテレータの順序を保証しないからです。
しかし、`items` 変数を使っているのは宣言の周辺だけなので、プログラマーはすぐにバグを修正できるでしょう。

次に、このコード片が大きなメソッドの一部分で、`items` 変数のスコープがもっと広かった場合を考えてみましょう。

```java
    var items = new HashSet<Item>(...);
    
    // ... 100 lines of code ...
    
    items.add(MUST_BE_PROCESSED_LAST);
    for (var item : items) ...
```

`ArrayList` から `HashSet` への変更による影響は一見して分からなくなってしまいました。
`items` を宣言している場所と使っている場所が離れてしまったからです。
このような場合、バグは長く残ってしまうことでしょう。

`items` を明示的な型の `List<String>` で宣言していれば、初期化子の変更に応じて `Set<String>` に変更しなければなりませんでした。
その場合、プログラマーはメソッドの中で  `items` を使っている部分に影響があることに気づいたはずです（気づかないかもしれませんが）。
`var` で変数を宣言したために、バグの混入リスクを高めてしまったのです。

`var` の使用に対する反対意見に聞こえるかもしれませんが、そういうつもりではありません。
最初のコード例における `var` の使い方は間違いなく適切なものでした。
問題になるのは変数のスコープが広すぎる場合です。
そういう場合は単純に `var` を使わないようにするのではなく、ローカル変数のスコープが狭くなるように修正するといいでしょう。

### G3. 読者にとって初期化子が十分な情報を伝えられているときは`var`で変数を宣言するか検討する

ローカル変数はコンストラクタを呼び出して初期化することが多いです。
変数の左側には、明示的な型として、生成されるオブジェクトのクラス名が繰り返し登場することになります。
クラス名がとても長い場合、`var`を使うと情報を失うことなく簡潔に表現できる場合があります。

```java
    // ORIGINAL
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    
    // GOOD
    var outputStream = new ByteArrayOutputStream();
```

コンストラクタではなくても静的ファクトリメソッドのように、初期化子で型の情報を十分に伝える名前のメソッドを呼び出している場合も、`var` を使用するのは適切でしょう。

```java
    // ORIGINAL
    BufferedReader reader = Files.newBufferedReader(...);
    List<String> stringList = List.of("a", "b", "c");
    
    // GOOD
    var reader = Files.newBufferedReader(...);
    var stringList = List.of("a", "b", "c");
```

メソッドの名前が返り値の型を強く示唆するようになっているため、変数の型を推測するのに役立ちます。

### G4. メソッド呼び出しの連鎖や入れ子のメソッド呼び出しを分解するため`var`でローカル変数を宣言する

次のように、文字列のコレクションから登場回数の一番多い文字列を発見するコードについて考えてみましょう。

```java
    return strings.stream()
                  .collect(groupingBy(s -> s, counting()))
                  .entrySet()
                  .stream()
                  .max(Map.Entry.comparingByValue())
                  .map(Map.Entry::getKey);
```

正しいコードですが、単独のストリームであるかのように混乱させてしまう可能性もあります。
実際には短いストリームの結果に、2つ目のストリームが続いてから、その結果である `Optional` を処理しています。
このコードの可読性を最大化するには、少なくとも2つか3つの式に分割したほうがいいでしょう。
最初のグループを map にして、その map を reduce して、存在する key を取得するのです。

```java
    Map<String, Long> freqMap = strings.stream()
                                       .collect(groupingBy(s -> s, counting()));
    Optional<Map.Entry<String, Long>> maxEntryOpt = freqMap.entrySet()
                                                           .stream()
                                                           .max(Map.Entry.comparingByValue());
    return maxEntryOpt.map(Map.Entry::getKey);
```

プログラムの作者は、制御フローを分解する代わりに中間変数を導入することについて、型名を記述するのが煩雑すぎると反対するでしょう。
`var`を使えば、中間変数の明示的な型を記述することなく、自然に表現できるようになります。

```java
    var freqMap = strings.stream()
                         .collect(groupingBy(s -> s, counting()));
    var maxEntryOpt = freqMap.entrySet()
                             .stream()
                             .max(Map.Entry.comparingByValue());
    return maxEntryOpt.map(Map.Entry::getKey);
```

最初のコードスニペットのような長いメソッド呼び出しの連鎖は正当な記述だし、そのほうがよいと主張する人もいるでしょう。
しかし、長いメソッド呼び出しの連鎖は分解したほうがよいです。
そういう場合、それぞれの中間変数を`var`で宣言するのは適切な使い方です。
2つ目のコードスニペットのように、明示的に完全な型を宣言するのは代替案として受け入れにくいでしょう。
その他さまざまな場合において、適切な`var`の使用には何らかの対価（明示的な型）と見返り（より良い名前、より良い構造）が伴うものなのです。

### G5. ローカル変数を使うときは「インターフェイスに対してプログラミングする」ことに固執しない

Java のプログラミングにおいて、具象型のインスタンスを生成してインターフェイス型の変数に代入するのは基本的なイディオムとして知られています。
実装ではなく抽象に依存することで、ソースコードの将来的な柔軟性を確保するのが目的です。

```java
    // ORIGINAL
    List<String> list = new ArrayList<>();
```

`var`を使用すると、変数の型として推論されるのはインターフェイス型ではなく具象型になります。

```java
    // Inferred type of list is ArrayList<String>.
    var list = new ArrayList<String>();
```

**繰り返して強調しますが**、`var` はローカル変数にしか使えません。
フィールドの型やメソッド引数の型、メソッドの返り値の型を推論するためには使えません。
それらのコンテキストでは、「インターフェイスに対してプログラミングする」という原則は今までのように重要です。

問題は、変数を使用するソースコードが具体的な実装に依存してしまうことです。
変数の初期化子を変更すると、推論される型が変化し、その変数を使用するコードにおけるエラーやバグの原因になります。

ガイドラインG2で推奨しているように、ローカル変数のスコープを狭くしていれば、具体的な実装が「漏洩」し、変数を使用するソースコードに影響を与えるリスクを限定的にできるでしょう。
変数がたった数行のソースコードでしか使われていなければ、たとえ問題が発生しても解決したり緩和したりするのは簡単です。

前のコード例の場合、`ArrayList`が持っている`List`に無いメソッドは`ensureCapacity`と`trimToSize`だけです。
これらのメソッドはリストの要素に影響しないので、たとえ呼び出していてもプログラムの正確性には影響しません。
したがって、インターフェイス型ではなく具象型を推論する影響はさらに軽減されるでしょう。

### G6. `var`をダイアモンド演算子や総称型メソッドと一緒に使うときは注意する

`var`と「ダイアモンド演算子」は、どちらも既存の情報から導出できるなら明示的な型情報を省略できる機能です。
ところで、これらは同じ場所で宣言できるのでしょうか。
次の例で考えてみましょう。

```java
    PriorityQueue<Item> itemQueue = new PriorityQueue<Item>();
```

次のようにすれば、型情報を失わずにダイアモンド演算子と`var`で書き換えることができます。

```java
    // OK: both declare variables of type PriorityQueue<Item>
    PriorityQueue<Item> itemQueue = new PriorityQueue<>();
    var itemQueue = new PriorityQueue<Item>();
```

`var`とダイアモンド演算子を同時に記述することもできますが、推論されるのは別の型になってしまいます。

```java
    // DANGEROUS: infers as PriorityQueue<Object>
    var itemQueue = new PriorityQueue<>();
```

ダイアモンド演算子は、変数宣言の左側に登場する型か、コンストラクタ引数の型を対象の型として、型推論を行います。
どちらにも型が存在しなければ、より広く適用できる型にフォールバックします。
たいていは `Object` になりますが、普通はそうなることを意図していません。

総称型メソッドには型推論機能が備わっているため、プログラマーが明示的に型引数を指定しなければならない場面はほとんどありません。
総称型メソッドは、必要な型情報を提供するメソッド引数が存在しない場合、対象の型に基づいて型推論を行います。
`var` の変数宣言には対象の型がないため、ダイアモンド演算子と同じような問題が発生します。

```java
    // DANGEROUS: infers as List<Object>
    var list = List.of();
```

ダイアモンド演算子と総称型メソッドのどちらも、コンストラクタやメソッドの引数により、推論させたい型の情報を提供できます。

```java
    // OK: itemQueue infers as PriorityQueue<String>
    Comparator<String> comp = ... ;
    var itemQueue = new PriorityQueue<>(comp);
    
    // OK: infers as List<BigInteger>
    var list = List.of(BigInteger.ZERO);
```

`var`の変数宣言とダイアモンド演算子あるいは総称型メソッドを組み合わせて使う場合、意図した型を推論できるだけの十分な情報を提供できるよう、コンストラクタやメソッドの引数を指定しましょう。
それができない場合、`var`の変数宣言とダイアモンド演算子あるいは総称型メソッドを同時に記述するのはやめましょう。

### G7. `var`の変数にリテラルを代入するときは注意する

`var`の変数宣言では、プリミティブ型のリテラルを初期化子に指定できます。
ほとんどのプリミティブ型の型名は短いため、`var`を使うだけの利点はほとんどありません。
しかし、変数名の縦の並びを揃えたいときは便利です。

論理値リテラル、文字リテラル、文字列リテラル、整数リテラル(long)については何も問題ありません。
正確な型を推論できるので、`var`で宣言した変数の型は明らかです。

```java
    // ORIGINAL
    boolean ready = true;
    char ch = '\ufffd';
    long sum = 0L;
    String label = "wombat";
    
    // GOOD
    var ready = true;
    var ch    = '\ufffd';
    var sum   = 0L;
    var label = "wombat";
```

特に注意が必要なのは初期化子に数値を、中でも整数リテラルを記述するときです。
変数宣言の左側に明示的な型を記述する場合、数値の型は`int`以外へ暗黙的に拡大および縮小されるでしょう。
`var`で変数を宣言した場合、その型は予想と違って`int`になります。

```java
    // ORIGINAL
    byte flags = 0;
    short mask = 0x7fff;
    long base = 17;
    
    // DANGEROUS: all infer as int
    var flags = 0;
    var mask = 0x7fff;
    var base = 17;
```

浮動小数リテラルから推論される型は基本的に明らかです。

```java
    // ORIGINAL
    float f = 1.0f;
    double d = 2.0;
    
    // GOOD
    var f = 1.0f;
    var d = 2.0;
```

`float`型リテラルは暗黙的に`double`型へ拡大されるので気を付けましょう。
これは、`double`型の変数に対する初期化子へ、明示的に`3.0f`のような`float`型リテラルを記述した場合にも起きる振る舞いですが、`double`型の変数を`float`型の変数で初期化する場合にも発生します。
`var`の変数を推論した型は`float`型になるため注意してください。

```java
    // ORIGINAL
    static final float INITIAL = 3.0f;
    ...
    double temp = INITIAL;
    
    // DANGEROUS: now infers as float
    var temp = INITIAL;
```

（とはいえ、これらの例はガイドラインG3に違反しています。つまり、初期化子は読者が型を推測するのに十分な情報を提供できていないのです）

## 具体例

このセクションでは`var`による変数宣言が最も役に立つ使い方を紹介します。

次のコードはMapについてマッチした要素を最大で`max`個削除します。
メソッドの柔軟性を高めるため、仮型引数はワイルドカードになっていますが、結果として冗長な記述になっています。
おかげで、Iteratorの型引数はワイルドカードをネストしなければならないため、より一層冗長な記述が増えてしまいます。
型の宣言が長くてforループの先頭部分が1行に入りきらなくなっており、読みにくさは悪化しています。

```java
    // ORIGINAL
    void removeMatches(Map<? extends String, ? extends Number> map, int max) {
        for (Iterator<? extends Map.Entry<? extends String, ? extends Number>> iterator =
                 map.entrySet().iterator(); iterator.hasNext();) {
            Map.Entry<? extends String, ? extends Number> entry = iterator.next();
            if (max > 0 && matches(entry)) {
                iterator.remove();
                max--;
            }
        }
    }
```

ローカル変数を`var`で宣言すると過剰な型の宣言を削減できます。
このような構造のループなら、IteratorやMap.Entryのローカル変数に明示的な型は必要ありません。
forループも一行に入るようになり、読みやすさはさらに改善しています。

```java
    // GOOD
    void removeMatches(Map<? extends String, ? extends Number> map, int max) {
        for (var iterator = map.entrySet().iterator(); iterator.hasNext();) {
            var entry = iterator.next();
            if (max > 0 && matches(entry)) {
                iterator.remove();
                max--;
            }
        }
    }
```

try-with-resources文を使っている、ソケットから1行のテキストを読み取るコードについて検討してみましょう。
ネットワークなどの各種入出力を行う API は、オブジェクトをラップするイディオムで記述します。
それぞれの中間オブジェクトはリソース変数として宣言し、後に続けてopenするラッパーでエラーが発生しても、適切にcloseできるようにしなければなりません。
慣習的なコードの書き方をするときは、変数宣言の左側と右側の両方にクラス名を書かなければなりません。
結果として、ソースコードはかなり賑やかになってしまいます。

```java
    // ORIGINAL
    try (InputStream is = socket.getInputStream();
         InputStreamReader isr = new InputStreamReader(is, charsetName);
         BufferedReader buf = new BufferedReader(isr)) {
        return buf.readLine();
    }
```

変数を`var`で宣言すればとてもおとなしくなります。

```java
    // GOOD
    try (var inputStream = socket.getInputStream();
         var reader = new InputStreamReader(inputStream, charsetName);
         var bufReader = new BufferedReader(reader)) {
        return bufReader.readLine();
    }
```

## まとめ

`var`の変数宣言は賑やかすぎるソースコードをおとなしくしてくれます。
そうすれば、より重要な情報を際立たせることができるため、ソースコードは改善します。
一方、見境なく`var`の変数宣言を使うとソースコードは悪化します。
適切に使用すれば、分かりやすさを損なうことなく、より短く、より明白なコードを書けるようになるでしょう。

## References

[JEP 286: Local-Variable Type Inference](https://openjdk.java.net/jeps/286)
[Wikipedia: Hungarian Notation](https://en.wikipedia.org/wiki/Hungarian_notation)
[Bloch, Joshua. Effective Java, 3rd Edition. Addison-Wesley Professional, 2018.](https://www.pearson.com/us/higher-education/program/Bloch-Effective-Java-3rd-Edition/PGM1763855.html)
