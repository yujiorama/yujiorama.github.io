## REST Assured

<!-- REST Assured is a Java DSL for simplifying testing of REST based services built on top of HTTP Builder. It supports POST, GET, PUT, DELETE, OPTIONS, PATCH and HEAD requests and can be used to validate and verify the response of these requests. -->
REST Assured は、REST ベースのサービスに対するテストを簡単に記述できる、HTTP Builder で構築された Java 専用の DSL です。
さまざまな HTTP メソッド（POST、GET、PUT、DELETE、OPTIONS、PATCH、HEAD）のリクエストに対するレスポンスを確認、検証できます。

### static imoprt

<!-- In order to use REST assured effectively it's recommended to statically import methods from the following classes: -->
REST Assured を効率的に使うには、次のような import 文を記述するといいでしょう。

```java
import static io.restassured.RestAssured.*;
import static io.restassured.matcher.RestAssuredMatchers.*;
import static org.hamcrest.Matchers.*;
```

<!-- If you want to use [Json Schema](http://json-schema.org/) validation you should also statically import these methods: -->
[Json Schema](http://json-schema.org/) のバリデーション機能を使うには、次のような import 文も追加するといいでしょう。

```java
import static io.restassured.module.jsv.JsonSchemaValidator.*;
```

<!-- Refer to [Json Schema Validation](#json-schema-validation) section for more info. -->
詳しくは [Json Schema Validation](#json-schema-validation) のセクションを参照してください。

<!-- If you're using Spring MVC you can use the [spring-mock-mvc](#spring-mock-mvc-module) module to unit test your Spring Controllers using the Rest Assured DSL. To do this statically import the methods from [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html) _instead_ of importing the methods from `io.restassured.RestAssured`: -->

あなたのアプリケーションが Spring MVC を使っているなら、[Spring Mock MVC](#spring-mock-mvc-module) モジュールを使えば、コントローラークラスのユニットテストを REST Assured の DSL で記述できます。
その場合、`io.restassured.RestAssured` の代わりに [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html) を import 文に記述します。

```java
import static io.restassured.module.mockmvc.RestAssuredMockMvc.*;
```

## Examples

### Example 1 - JSON

<!-- Assume that the GET request (to http://localhost:8080/lotto) returns JSON as: -->
`http:/localhost:8080/lotto` に対する GET リクエストが次のような JSON を返すことにします。

```javascript
{
  "lotto":{
    "lottoId":5,
    "winning-numbers":[2,45,34,23,7,5,3],
    "winners":[
      {
        "winnerId":23,
        "numbers":[2,45,34,23,3,5]
      },
      {
        "winnerId":54,
        "numbers":[52,3,12,11,18,22]
      }
    ]
  }
}
```

<!-- REST assured can then help you to easily make the GET request and verify the response. E.g. if you want to verify that lottoId is equal to 5 you can do like this: -->
REST Assured で、GET リクエストに対するレスポンスの `lottoId` が `5` になることを検証するときは次のように記述します。とても簡単です。

```java
    get("/lotto")
    .then()
        .body("lotto.lottoId", equalTo(5));
```

<!-- or perhaps you want to check that the winnerId's are 23 and 54: -->
`winnerId` に `23` と `24` が入っていることを確認するときは次のように記述します。

```java
    get("/lotto")
    .then()
        .body("lotto.winners.winnerId", hasItems(23, 54));
```

<!-- Note: `equalTo` and `hasItems` are Hamcrest matchers which you should statically import from `org.hamcrest.Matchers`. -->
注意：`equalTo` と `hasItems` は Hamcrest ライブラリのマッチャーメソッドなので、`org.hamcrest.Matchers` の import 文を追加する必要があります。

<!-- Note that the "json path" syntax uses <a href='http://groovy-lang.org/processing-xml.html#_gpath'>Groovy's GPath</a> notation and is not to be confused with Jayway's <a href='https://github.com/jayway/JsonPath'>JsonPath</a> syntax. -->
JSONPath の記法として、[Jayway の JsonPath](https://github.com/jayway/JsonPath) ではなく、[Groovy の GPath](http://groovy-lang.org/processing-xml.html#_gpath) を使っているので、間違えないようにしてください。

#### Returning floats and doubles as BigDecimal

<!-- You can configure Rest Assured and JsonPath to return BigDecimal's instead of float and double for Json Numbers. For example consider the following JSON document: -->
REST Assured では、設定により JSONPath で指定した json number の値を `float` や `double` ではなく `BigDecimal` として処理できます。
次のような JSON ドキュメントがあることにしましょう。

```javascript
{

    "price": 12.12

}
```

<!-- By default  you validate that price is equal to 12.12 as a float like this: -->
初期設定では、`price` の値は `float` の `12.12` と比較できます。

```java
    get("/price")
    .then()
        .body("price", is(12.12f));
```

<!-- but if you like you can configure REST Assured to use a JsonConfig that returns all Json numbers as BigDecimal: -->
`JsonConfig` オブジェクトを次のように設定すれば、全ての json number の値を `BigDecimal` で比較できるようになります。

```java
    given()
        .config(
            RestAssured.config().jsonConfig(
                jsonConfig().numberReturnType(BIG_DECIMAL)))
    .when()
        .get("/price")
    .then()
        .body("price", is(new BigDecimal(12.12));
```

#### JSON Schema validation

<!-- From version `2.1.0` REST Assured has support for [Json Schema](http://json-schema.org/) validation. For example given the following schema located in the classpath as `products-schema.json`: -->
REST Assured はバージョン `2.1.0` から [Json Schema](http://json-schema.org/) のバリデーションに対応しました。
例えば、次のようなスキーマを記述した `products-schema.json` がクラスパスにあることにしましょう。

```javascript
{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Product set",
    "type": "array",
    "items": {
        "title": "Product",
        "type": "object",
        "properties": {
            "id": {
                "description": "The unique identifier for a product",
                "type": "number"
            },
            "name": {
                "type": "string"
            },
            "price": {
                "type": "number",
                "minimum": 0,
                "exclusiveMinimum": true
            },
            "tags": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "minItems": 1,
                "uniqueItems": true
            },
            "dimensions": {
                "type": "object",
                "properties": {
                    "length": {"type": "number"},
                    "width": {"type": "number"},
                    "height": {"type": "number"}
                },
                "required": ["length", "width", "height"]
            },
            "warehouseLocation": {
                "description": "Coordinates of the warehouse with the product",
                "$ref": "http://json-schema.org/geo"
            }
        },
        "required": ["id", "name", "price"]
    }
}
```

<!-- you can validate that a resource (`/products`) conforms with the schema: -->
次のように記述すると、JSON スキーマで、リソース `/products` から取得した JSON ドキュメントを検証できます。

```java
    get("/products")
    .then()
        .assertThat()
        .body(matchesJsonSchemaInClasspath("products-schema.json"));
```

<!-- `matchesJsonSchemaInClasspath` is statically imported from `io.restassured.module.jsv.JsonSchemaValidator` and it's recommended to statically import all methods from this class. However in order to use it you need to depend on the `json-schema-validator` module by either [downloading](http://dl.bintray.com/johanhaleby/generic/json-schema-validator-4.4.0-dist.zip) it from the download page or add the following dependency from Maven: -->
`matchesJsonSchemaInClasspath` は `io.restassured.module.jsv.JsonSchemaValidator` のクラスメソッドです。
全てのクラスメソッドを static import しておくことをお勧めします。
この機能を使用するには、 `json-schema-validator` モジュールを Maven の依存ライブラリへ追加しなければなりません。

```xml
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>json-schema-validator</artifactId>
        <version>4.4.0</version>
    </dependency>
```

#### JSON Schema Validation Settings

<!-- REST Assured's `json-schema-validator` module uses Francis Galiegue's [json-schema-validator](https://github.com/fge/json-schema-validator) (`fge`) library to perform validation. If you need to configure the underlying `fge` library you can for example do like this: -->
REST Assured の `json-schema-validator` モジュールは、Francis Galiegue の [json-schema-validator](https://github.com/fge/json-schema-validator) ライブラリ（以降は `fge` と呼びます）を使用してバリデーションを行います。
`fge` ライブラリの設定を変更するときは次のように記述してください。

```java
    // Given
    JsonSchemaFactory jsonSchemaFactory = JsonSchemaFactory.newBuilder()
        .setValidationConfiguration(
            ValidationConfiguration.newBuilder()
                .setDefaultVersion(DRAFTV4).freeze())
        .freeze();

    // When
    get("/products")
    .then()
        .assertThat()
        .body(matchesJsonSchemaInClasspath("products-schema.json")
            .using(jsonSchemaFactory));
```

<!-- The `using` method allows you to pass in a `jsonSchemaFactory` instance that REST Assured will use during validation. This allows fine-grained configuration for the validation. -->
バリデーションに使用する `jsonSchemaFactory` のインスタンスは `using` メソッドで指定できます。
バリデーションの内容をより細かく調整したいときに使用してください。

<!-- The `fge` library also allows the validation to be `checked` or `unchecked`. By default REST Assured uses `checked` validation but if you want to change this you can supply an instance of [JsonSchemaValidatorSettings](http://static.javadoc.io/io.rest-assured/json-schema-validator/latest/io/restassured/module/jsv/JsonSchemaValidatorSettings.html) to the matcher. For example: -->
`fge` ライブラリは `checked` と `unchecked` の2種類のバリデーションを使用できます。
初期設定では `checked` バリデーションを使用しますが、`unchecked` バリデーションを使用したいときは [JsonSchemaValidatorSettings](http://static.javadoc.io/io.rest-assured/json-schema-validator/latest/io/restassured/module/jsv/JsonSchemaValidatorSettings.html) のインスタンスを構成してください。

```java
    get("/products")
    .then()
        .assertThat()
        .body(matchesJsonSchemaInClasspath("products-schema.json")
            .using(settings().with().checkedValidation(false)));
```

<!-- Where the `settings` method is statically imported from the [JsonSchemaValidatorSettings](http://static.javadoc.io/io.rest-assured/json-schema-validator/latest/io/restassured/module/jsv/JsonSchemaValidatorSettings.html) class. -->
`settings` は `JsonSchemaValidatorSettings` のクラスメソッドです。

#### Json Schema Validation with static configuration

<!-- Now imagine that you always want to use `unchecked` validation as well as setting the default json schema version to version 3. Instead of supplying this to all matchers throughout your code you can define it statically. For example: -->
常に `unchecked` バリデーションを使用すると同時に、JSON スキーマのバージョン 3 を使用するようにしたい場合は、毎回設定する代わりに、クラスメンバ変数で設定できるようになっています。

```java
    JsonSchemaValidator.settings = settings().with().jsonSchemaFactory(
        JsonSchemaFactory.newBuilder().setValidationConfiguration(
            ValidationConfiguration.newBuilder()
                .setDefaultVersion(DRAFTV3).freeze())
        .freeze())
    .and()
    .with()
        .checkedValidation(false);

    get("/products")
    .then()
        .assertThat()
        .body(matchesJsonSchemaInClasspath("products-schema.json"));
```

<!-- Now any `matcher` method imported from [JsonSchemaValidator](http://static.javadoc.io/io.rest-assured/json-schema-validator/latest/io/restassured/module/jsv/JsonSchemaValidatorSettings.html) will use `DRAFTV3` as default version and unchecked validation. -->
[JsonSchemaValidator](http://static.javadoc.io/io.rest-assured/json-schema-validator/latest/io/restassured/module/jsv/JsonSchemaValidator.html) のクラスメンバ変数 `settings` を変更すると、`JsonSchemaValidator` からインポートした全ての `matcher` メソッドが `DRAFTV3` バージョンと `unchecked` バリデーションを使うようになります。

<!-- To reset the `JsonSchemaValidator` to its default settings simply call the `reset` method: -->
`JsonSchemaValidator` を初期設定へ戻すには `rest` メソッドを呼び出します。

```java
    JsonSchemaValidator.reset();
```

#### Json Schema Validation without REST Assured

<!-- You can also use the `json-schema-validator` module without depending on REST Assured. As long as you have a JSON document represented as a `String` you can do like this: -->
`json-schema-validator` モジュールは単独で使用することもできます。
JSON ドキュメントが `String` になっているなら次のように記述できます。

```java
import org.junit.Test;
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;
import static org.hamcrest.MatcherAssert.assertThat;
 
public class JsonSchemaValidatorWithoutRestAssuredTest {
 
 
    @Test public void
    validates_schema_in_classpath() {
        // Given
        String json = ... // Greeting response
 
        // Then
        assertThat(json, matchesJsonSchemaInClasspath("greeting-schema.json"));
    }
}
```

<!-- Refer to the [getting started](GattingStarted) page for more info on this. -->
詳しくは [REST Assured 入門](GettingStarted) を参照してください。

#### Anonymous JSON root validation

<!-- A JSON document doesn't necessarily need a named root attribute. This is for example valid JSON: -->
JSON ドキュメントの中には名前付きのルート属性がない場合もあります。
例えば、次のコードは正しい JSON ドキュメントです。

```javascript
[1, 2, 3]
```

<!-- An anonymous JSON root can be verified by using `$` or an empty string as path. For example let's say that this JSON document is exposed from `http://localhost:8080/json` then we can validate it like this with REST Assured: -->
JSONPath に `$` あるいは空文字列を指定すると、匿名のルート要素を確認できます。
例えば `http:/localhost:8080/json` が前のような JSON ドキュメントを返すとしたら、次のように検証できます。

```java
    when()
        .get("/json")
    .then()
        .body("$", hasItems(1, 2, 3));
        // An empty string "" would work as well
        // .body("", hasItems(1, 2, 3));
```

### Example 2 - XML

<!-- XML can be verified in a similar way. Imagine that a POST request to `http://localhost:8080/greetXML` returns: -->
XML ドキュメントも同じように確認できます。
`http://localhost:8080/greetXML` に対する POST リクエストが次のようなレスポンスを返すことにしましょう。

```xml
<greeting>
   <firstName>{params("firstName")}</firstName>
   <lastName>{params("lastName")}</lastName>
</greeting>
```

<!-- i.e. it sends back a greeting based on the firstName and lastName parameter sent in the request. You can easily perform and verify e.g. the firstName with REST assured: -->
注意：このURLで公開しているのは、リクエストパラメータで送信した `firstName` と `lastName` をそのまま送り返すサービスだと考えてください。

リクエストパラメータで送信した `firstName` に対応するレスポンスは次のように検証できます。

```java
    given()
        .parameters("firstName", "John", "lastName", "Doe")
    .when()
        .post("/greetXML")
    .then()
        .body("greeting.firstName", equalTo("John"));
```

<!-- If you want to verify both firstName and lastName you may do like this: -->
`firstName` と `lastName` を両方とも検証するときは次のように記述します。

```java
    given()
        .parameters("firstName", "John", "lastName", "Doe")
    .when()
        .post("/greetXML")
    .then()
        .body("greeting.firstName", equalTo("John"))
        .body("greeting.lastName", equalTo("Doe"));
```

<!-- or a little shorter: -->
省略記法も使用できます。

```java
    with()
        .parameters("firstName", "John", "lastName", "Doe")
    .when()
        .post("/greetXML")
    .then()
        .body("greeting.firstName", equalTo("John"),
            "greeting.lastName", equalTo("Doe"));
```

<!-- See [this](http://groovy-lang.org/processing-xml.html#_gpath) link for more info about the syntax (it follows Groovy's [GPath](http://groovy-lang.org/processing-xml.html#_gpath) syntax). -->
フィールドを指定する記法について詳しくは [Groovy の GPath](http://groovy-lang.org/processing-xml.html#_gpath) を参照してください。

#### XML namespaces

<!-- To make body expectations take namespaces into account you need to declare the namespaces using the [io.restassured.config.XmlConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/XmlConfig.html). For example let's say that a resource called `namespace-example` located at `http://localhost:8080` returns the following XML: -->
レスポンス本文の期待値に名前空間を指定するときは、[io.restassured.config.XmlConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/XmlConfig.html) で名前空間を宣言しなければなりません。
具体例として、`http://localhost:8080` で提供しているリソース `namespace-example` が次のような XML ドキュメントを返すことにします。

```xml
<foo xmlns:ns="http://localhost/">
  <bar>sudo </bar>
  <ns:bar>make me a sandwich!</ns:bar>
</foo>
```

<!-- You can then declare the `http://localhost/` uri and validate the response: -->
URI `http://localhost/` を名前空間として宣言し、XML ドキュメントを検証するには、次のように記述します。

```java
    given()
        .config(
            RestAssured.config().xmlConfig(
                xmlConfig()
                    .declareNamespace("test", "http://localhost/")))
    .when()
        .get("/namespace-example")
     .then()
        .body("foo.bar.text()", equalTo("sudo make me a sandwich!"))
        .body(":foo.:bar.text()", equalTo("sudo "))
        .body("foo.test:bar.text()", equalTo("make me a sandwich!"));
```

<!-- The path syntax follows Groovy's XmlSlurper syntax. Note that in versions prior to 2.6.0 the path syntax was *not* following Groovy's XmlSlurper syntax. Please see [release notes](https://github.com/rest-assured/rest-assured/wiki/ReleaseNotes26#non-backward-compatible-changes) for versin 2.6.0 to see how the previous syntax looked like. -->
この例で使用しているパス記法は、Groovy の XmlSlurper 記法です（`2.6.0` より前のバージョンでは XmlSlurper 記法を使えません）。
`2.6.0` より前のバージョンで使用できる記法を知りたければ [リリースノートの後方互換性に関する記述](https://github.com/rest-assured/rest-assured/wiki/ReleaseNotes26#non-backward-compatible-changes) を参照してください。

#### XPath

<!-- You can also verify XML responses using x-path. For example: -->
XML ドキュメントは XPath で確認することもできます。

```java
    given()
        .parameters("firstName", "John", "lastName", "Doe")
    .when()
        .post("/greetXML")
    .then()
        .body(hasXPath("/greeting/firstName", containsString("Jo")));
```

<!-- or -->
別の書き方も出来ます。

```java
    given()
        .parameters("firstName", "John", "lastName", "Doe")
    .when()
        .post("/greetXML")
    .then()
        .body(hasXPath("/greeting/firstName[text()='John']"));
```

<!-- To use namespaces in the XPath expression you need to enable them in the configuration, for example: -->
XPath で名前空間を使用するときは、`XmlConfig` で有効化しなければなりません。

```java
    given()
        .config(
            RestAssured.config().xmlConfig(
                xmlConfig()
                    .with()
                    .namespaceAware(true)))
    .when()
        .get("/package-db-xml")
    .then()
        .body(hasXPath("/db:package-database", namespaceContext));
```

<!-- Where `namespaceContext` is an instance of [javax.xml.namespace.NamespaceContext](http://docs.oracle.com/javase/7/docs/api/javax/xml/namespace/NamespaceContext.html). -->
`namespaceContext` は [javax.xml.namespace.NamespaceContext](https://docs.oracle.com/javase/8/docs/api/javax/xml/namespace/NamespaceContext.html) のインスタンスです。

#### Schema and DTD validation

<!-- XML response bodies can also be verified against an XML Schema (XSD) or DTD. -->
XML ドキュメントの検証に XML スキーマ（XSD）や DTD を使うこともできます。

##### XSD example

```java
    get("/carRecords")
    .then()
        .assertThat()
        .body(matchesXsd(xsd));
```

##### DTD example

```java
    get("/videos")
    .then()
        .assertThat()
        .body(matchesDtd(dtd));
```

<!-- The <code>matchesXsd</code> and <code>matchesDtd</code> methods are Hamcrest matchers which you can import from <a href="http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/matcher/RestAssuredMatchers.html">io.restassured.matcher.RestAssuredMatchers</a>.<br>
 -->`matchesXsd` や `matchesDtd` は [io.restassured.matcher.RestAssuredMatchers](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/matcher/RestAssuredMatchers.html) のクラスメソッドで、Hamcrest マッチャーです。

### Example 3 - Complex parsing and validation

<!-- This is where REST Assured really starts to shine! Since REST Assured is implemented in Groovy it can be really beneficial to take advantage of Groovy’s collection API. Let’s begin by looking at an example in Groovy: -->
REST Assured が特に際立つ使い方を説明しましょう。
REST Assured は Groovy で実装しているので、Groovy のコレクション API の素晴らしいところがそのまま利点になっています。
Groovy の例を見てみましょう。


```groovy
def words = ['ant', 'buffalo', 'cat', 'dinosaur']
def wordsWithSizeGreaterThanFour = words.findAll { it.length() > 4 }
```

<!-- At the first line we simply define a list with some words but the second line is more interesting.
Here we search the words list for all words that are longer than 4 characters by calling the findAll with a Groovy closure. 
The closure has an implicit variable called `it` which represents the current item in the list. 
The result is a new list, `wordsWithSizeGreaterThanFour`, containing `buffalo` and `dinosaur`.  -->
1行目は単語（文字列）のリストを定義しているだけですが、2行目はちょっと面白いことをしています。
単語のリストから4文字以上の単語を探索するため、`findAll` メソッドに4文字以上が真になる式をクロージャで渡しているのです。
クロージャの内部では暗黙的な変数 `it` がリストの要素になります。
新しいリスト `wordsWithSizeGreaterThanFour` には `buffalo` と `dinosaur` が含まれることになります。

<!-- There are other interesting methods that we can use on collections in Groovy as well, for example: -->
Groovy のコレクションには、他にもいろんなメソッドがあります。

<!-- * `find` – finds the first item matching a closure predicate
* `collect` – collect the return value of calling a closure on each item in a collection
* `sum` – Sum all the items in the collection
* `max`/`min` – returns the max/min values of the collection -->
* `find` – クロージャの式が真になる最初の要素を探索します
* `collect` – それぞれの要素についてクロージャを評価した結果を返します
* `sum` – コレクションの全ての要素を加算します
* `max`/`min` – コレクションの全ての要素について最大あるいは最小の要素を返します

<!-- So how do we take advantage of this when validating our XML or JSON responses with REST Assured? -->
JSON ドキュメントや XML ドキュメントをバリデーションするのに、これらの API がどのように使われているのか説明しましょう。

#### XML Example

<!-- Let’s say we have a resource at `http://localhost:8080/shopping` that returns the following XML: -->
`http://localhost:8080/shopping` が次のような XML ドキュメントを返すことにします。

```xml
<shopping>
      <category type="groceries">
        <item>Chocolate</item>
        <item>Coffee</item>
      </category>
      <category type="supplies">
        <item>Paper</item>
        <item quantity="4">Pens</item>
      </category>
      <category type="present">
        <item when="Aug 10">Kathryn's Birthday</item>
      </category>
</shopping>
```

<!-- Let’s also say we want to write a test that verifies that the category of type groceries has items Chocolate and Coffee. In REST Assured it can look like this: -->
このような XML ドキュメントについて、種類（type）が食料品（groceries）、内容（items）にチョコレート（Chocolate）とコーヒー（Coffee）を含むカテゴリー（category）があることを確かめるには、次のように記述します。


```java
    when()
        .get("/shopping")
    .then()
        .body("shopping.category.find { it.@type == 'groceries' }.item", hasItems("Chocolate", "Coffee"));
```

<!-- What's going on here? First of all the XML path `shopping.category` returns a list of all categories.
On this list we invoke a function, `find`, to return the single category that has the XML attribute, `type`, equal to `groceries`. 
On this category we then continue by getting all the items associated with this category. 
Since there are more than one item associated with the groceries category a list will be returned and we verify this list against the `hasItems` Hamcrest matcher. -->
詳しく見ていきましょう。
XPath に指定した `shopping.category` はカテゴリーのリストを返します。
そして、カテゴリーのリストに対する `find` は `type` 属性が `groceries` に一致する最初のカテゴリーを返します。
それから、発見したカテゴリーに関連付けられた全ての `item` を返します。
最終的に1つ以上の `item` からなるリストを `hasItems` マッチャーで検証します。

<!-- But what if you want to get the items and not validate them against a Hamcrest matcher? For this purpose you can use [XmlPath](http://static.javadoc.io/io.rest-assured/xml-path/latest/io/restassured/path/xml/XmlPath.html): -->
`item` を取得するだけで、検証したいわけではないとしたらどうすればいいでしょうか。
そういうときは [XmlPath](http://static.javadoc.io/io.rest-assured/xml-path/latest/io/restassured/path/xml/XmlPath.html) を使用します。

```java
// Get the response body as a String
String response = get("/shopping").asString();
// And get the groceries from the response. "from" is statically imported from the XmlPath class
List<String> groceries = from(response).getList("shopping.category.find { it.@type == 'groceries' }.item");
```

<!-- If the list of groceries is the only thing you care about in the response body you can also use a [shortcut](#single-path): -->
レスポンス本文について、食料品（groceries）のリストだけを処理したい場合は [ショートカット](#single-path) することもできます。

```java
// Get the response body as a String
List<String> groceries = get("/shopping").path("shopping.category.find { it.@type == 'groceries' }.item");
```

##### Depth-first search

<!-- It's actually possible to simplify the previous example even further: -->
前に説明した内容は次のような省略記法でも実現できます。

```java
    when()
        .get("/shopping")
    .then()
        .body("**.find { it.@type == 'groceries' }", hasItems("Chocolate", "Coffee"));
```

<!-- `**` is a shortcut for doing depth first searching in the XML document.
We search for the first node that has an attribute named `type` equal to "groceries". Notice also that we don't end the XML path with "item". 
The reason is that `toString()` is called automatically on the category node which returns a list of the item values. -->
`**` は XML ドキュメントについて深さ優先探索をする省略記法です。
`type` 属性が `groceries` に一致する最初のノードを検索できます。
XPath に `item` を書いてないことに注目してください。
それぞれのカテゴリーノードについて `item` のリストを返すとき、自動的に `toString()` メソッドが呼び出されるからです。

#### JSON Example

<!-- Let's say we have a resource at `http://localhost:8080/store` that returns the following JSON document: -->
`http://localhost:8080/store` が次のような JSON ドキュメントを返すことにします。

```javascript
{  
   "store":{  
      "book":[  
         {  
            "author":"Nigel Rees",
            "category":"reference",
            "price":8.95,
            "title":"Sayings of the Century"
         },
         {  
            "author":"Evelyn Waugh",
            "category":"fiction",
            "price":12.99,
            "title":"Sword of Honour"
         },
         {  
            "author":"Herman Melville",
            "category":"fiction",
            "isbn":"0-553-21311-3",
            "price":8.99,
            "title":"Moby Dick"
         },
         {  
            "author":"J. R. R. Tolkien",
            "category":"fiction",
            "isbn":"0-395-19395-8",
            "price":22.99,
            "title":"The Lord of the Rings"
         }
      ]
   }
}
```

##### Example 1

<!-- As a first example let's say we want to make the request to "/store" and assert that the titles of the books with a price less than 10 are "Sayings of the Century" and "Moby Dick": -->
1つ目の例は、`/store` にリクエストを送信し、レスポンスについて価格（price）が10未満の本（book）の書名（title）が "Sayings of the Century" と "Moby Dick" であることを検証する場合です。

```java
    when()
        .get("/store")
    .then()
        .body("store.book.findAll { it.price < 10 }.title", hasItems("Sayings of the Century", "Moby Dick"));
```

<!-- Just as in the XML examples above we use a closure to find all books with a price less than 10 and then return the titles of all the books.  -->
<!-- We then use the `hasItems` matcher to assert that the titles are the ones we expect. Using [JsonPath](http://static.javadoc.io/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) we can return the titles instead: -->
XML ドキュメントと同様に、価格が10未満なら真になる式を評価するクロージャで、全ての本を探索します。
そして `hasItems` マッチャーで期待値と比較します。
[JsonPath](http://static.javadoc.io/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) を使うと `title` のリストを取得できます。

```java
// Get the response body as a String
String response = get("/store").asString();
// And get all books with price < 10 from the response. "from" is statically imported from the JsonPath class
List<String> bookTitles = from(response).getList("store.book.findAll { it.price < 10 }.title");
```

##### Example 2

<!--  Let's consider instead that we want to assert that the sum of the length of all author names are greater than 50.
 This is a rather complex question to answer and it really shows the strength of closures and Groovy collections. 
 In REST Assured it looks like this: -->
 2つ目の例として、著者名の文字列長の合計が50を越えるかどうかを検証してみましょう。
 少し複雑な目的のため、Groovy のコレクションとクロージャの組み合わせの強力さを説明するちょうどいい例になっているでしょう。

```java
     when()
         .get("/store")
     .then()
         .body("store.book.author.collect { it.length() }.sum()", greaterThan(50));
```

<!-- First we get all the authors (`store.book.author`) and invoke the collect method on the resulting list with the closure `{ it.length() }`.
What it does is to call the `length()` method on each author in the list and returns the result to a new list. 
On this list we simply call the `sum()` method to sum all the lengths.
The end result is `53` and we assert that its greater than 50 by using the `greaterThan` matcher.
But its actually possible to simplify this even further. Consider the "[words](#example-3---complex-parsing-and-validation)" example again: -->
`store.book.author` は全ての著者名のリストになります。
そして著者名のリストに `collect` メソッドでクロージャ `{ it.length() }` を適用し、著者名の文字列長のリストを取得します。
それから文字列長のリストに `sum()` メソッドを呼び出して、文字列長の合計を計算します。
最後に `greaterThan` マッチャーで文字列長の合計が `53` を越えるか検証します。
実はこの記述も省略できます。
"[word](#example-3---complex-parsing-and-validation)" の例で説明します。

```groovy
def words = ['ant', 'buffalo', 'cat', 'dinosaur']
```

<!-- Groovy has a very handy way of calling a function for each element in the list by using the spread operator, `*`. For example: -->
Groovy では展開演算子（spread operator） `*` でリストのそれぞれの要素に関数を呼び出すことができます。

```groovy
def words = ['ant', 'buffalo', 'cat', 'dinosaur']
assert [3, 6, 3, 8] == words*.length()
```

<!-- I.e. Groovy returns a new list with the lengths of the items in the words list. We can utilize this for the author list in REST Assured as well: -->
展開演算子を使うと、前のコード例は次のように記述できます。

```java
    when()
        .get("/store")
    .then()
        .body("store.book.author*.length().sum()", greaterThan(50));
```

<!-- And of course we can use [JsonPath](http://static.javadoc.io/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) to actually return the result: -->
もちろん、[JsonPath](http://static.javadoc.io/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) で値を取得することもできます。

```java
// Get the response body as a string
String response = get("/store").asString();
// Get the sum of all author length's as an int. "from" is again statically imported from the JsonPath class
int sumOfAllAuthorLengths = from(response).getInt("store.book.author*.length().sum()");
// We can also assert that the sum is equal to 53 as expected.
assertThat(sumOfAllAuthorLengths, is(53));
```

### Deserialization with Generics

<!-- REST Assured 3.3.0 introduced the `io.restassured.mapper.TypeRef` class that allows you to de-serialize the response to a container with a generic type. For example let's say that you have a service that returns the following JSON for a GET request to `/products`: -->
REST Assured `3.3.0` では `io.restassured.mapper.TypeRef` クラスを導入しました。
これは、レスポンスを総称型のコンテナへ分解するために使用します。
例えば、`/products` に対する GET リクエストが次のような JSON ドキュメントを返すことにしましょう。

```json
[
          {
              "id": 2,
              "name": "An ice sculpture",
              "price": 12.50,
              "tags": ["cold", "ice"],
              "dimensions": {
                  "length": 7.0,
                  "width": 12.0,
                  "height": 9.5
              },
              "warehouseLocation": {
                  "latitude": -78.75,
                  "longitude": 20.4
              }
          },
          {
              "id": 3,
              "name": "A blue mouse",
              "price": 25.50,
                  "dimensions": {
                  "length": 3.1,
                  "width": 1.0,
                  "height": 1.0
              },
              "warehouseLocation": {
                  "latitude": 54.4,
                  "longitude": -32.7
              }
          }
      ]
```

<!-- You can then extract the root list to a `List<Map<String, Object>>` (or a any generic container of choice) using the `TypeRef`: -->
`TypeRef` を使うと、このドキュメントのルート要素を `List<Map<String, Object>>` へ変換できます（これ以外にも任意の総称型コンテナへ変換できます）。

```java
// Extract
List<Map<String, Object>> products = get("/products").as(new TypeRef<List<Map<String, Object>>>() {});

// Now you can do validations on the extracted objects:
assertThat(products, hasSize(2));
assertThat(products.get(0).get("id"), equalTo(2));
assertThat(products.get(0).get("name"), equalTo("An ice sculpture"));
assertThat(products.get(0).get("price"), equalTo(12.5));
assertThat(products.get(1).get("id"), equalTo(3));
assertThat(products.get(1).get("name"), equalTo("A blue mouse"));
assertThat(products.get(1).get("price"), equalTo(25.5));```

```

<!-- Note that currently this only works for JSON responses. -->
この機能は今のところ JSON ドキュメントにしか使用できないので注意してください。

### Additional Examples

<!-- Micha Kops has written a really good blog with several examples (including code examples that you can checkout). You can read it [here](http://www.hascode.com/2011/10/testing-restful-web-services-made-easy-using-the-rest-assured-framework/). -->
Micha Kops が[さまざまな具体例を説明するよいブログ記事](http://www.hascode.com/2011/10/testing-restful-web-services-made-easy-using-the-rest-assured-framework/)を書いています。

<!-- Also [Bas Dijkstra](https://www.linkedin.com/in/basdijkstra) has been generous enough to open source his REST Assured workshop. You can read more about this [here](http://www.ontestautomation.com/open-sourcing-my-workshop-an-experiment/) and you can try out, and contribute to, the exercises available in [his](https://github.com/basdijkstra/workshops/) github repository. -->
また、[Bas Dijkstra](https://www.linkedin.com/in/basdijkstra) は自身の主催している [REST Assured の活用ワークショップ](http://www.ontestautomation.com/open-sourcing-my-workshop-an-experiment/)をオープンソースとして [GitHub リポジトリ](https://github.com/basdijkstra/workshops/)で惜しみなく公開してくれているので、誰でも試すことができるし、誰でも貢献できるようになっています。

<!-- Bas has also made a nice introductory screencast to REST Assured, you can find it [here](https://testautomationu.applitools.com/automating-your-api-tests-with-rest-assured/).  -->
Bas Dijkstra は、他にも [REST Assured を紹介する素敵なスクリーンキャスト](https://testautomationu.applitools.com/automating-your-api-tests-with-rest-assured/)を公開しています。

### Note on floats and doubles

<!-- Floating point numbers must be compared with a Java "float" primitive. For example, if we consider the following JSON object: -->
浮動小数点数は Java の基本型の `float` と比較しなければなりません。
例えば、次のような JSON オブジェクトがあることにしましょう。


```javascript
{

    "price": 12.12

}
```

the following test will fail, because we compare with a "double" instead of a "float":
次のテストは、`float` じゃなくて `double` で比較しているため失敗してします。

```java
get("/price").then().assertThat().body("price", equalTo(12.12));
```

<!-- Instead, compare with a float with: -->
`float` と比較すれば成功します。

```java
get("/price").then().assertThat().body("price", equalTo(12.12f));
```

### Note on syntax

<!-- When reading blogs about REST Assured you may see a lot of examples using the "given / expect / when" syntax, for example: -->
REST Assured のブログ記事に登場するコード例では `given/expect/when` という記法がたくさん使われています。

```java
    given()
        .param("x", "y")
    .expect()
        .body("lotto.lottoId", equalTo(5))
    .when()
        .get("/lotto");
```

<!-- This is the so called "legacy syntax" which was the de facto way of writing tests in REST Assured 1.x. While this works fine it turned out to be quite confusing and annoying for many users. The reason for not using "given / when / then" in the first place was mainly technical. So prior to REST Assured 2.0 there was no support "given / when / then" which is more or less the standard approach when you're doing some kind of BDD-like testing. The "given / expect / when" approach still works fine in 2.0 and above but "given / when / then" reads better and is easier to understand for most people and is thus recommended in most cases. There's however one benefit of using the "given / expect / when" approach and that is that ALL expectation errors can be displayed at the same time which is not possible with the new syntax (since the expectations are defined last). This means that if you would have had multiple expectations in the previous example such as -->
これは「レガシー記法」と呼ばれるもので、REST Assured 1.x でテストを記述するための、事実上の標準になっている記法でした。
最新バージョンでも正常に動作するので、何が正しいかを巡って多くのユーザーを混乱させています。

最初に `given/when/then` 記法を使わなかったのは純粋に技術的な問題があったからです。
REST Assured 2.0 が出るまで `given/when/then` 記法に対応しなかったのは、BDD スタイルのテストとして標準的な方法とは言えない状況だったからです。
その頃は `given/expect/when` 記法がそれなりに存在感を示していたのですが、しばらくすると `given/when/then` 記法の分かりやすさが認知され始め、大半の場合に使われる記法になっていきました。

`given/expect/when` 記法には `given/when/then` 記法にない良いところがあります。
それは、期待値に対する全てのエラーを同時に表示できるところです（最後に期待値を書く記法だとできない）。

例えば、前のコード例にステータスコードの期待値を追加したら次のようになります。

```java
    given()
        .param("x", "y")
    .expect()
        .statusCode(400)
        .body("lotto.lottoId", equalTo(6))
    .when()
        .get("/lotto");
```

<!-- REST Assured will report that both the status code expectation and the body expectation are wrong. Rewriting this with the new syntax -->
この場合、REST Assured はステータスコードとレスポンス本文それぞれの期待値との不一致を報告します。
これを `given/when/then` 記法で書いてみましょう。

```java
    given()
        .param("x", "y")
    .when()
        .get("/lotto")
    .then()
        .statusCode(400)
        .body("lotto.lottoId", equalTo(6));
```

<!-- will only report an error at the first failed expectation / assertion (that status code was expected to be 400 but it was actually 200). You would have to re-run the test in order to catch the second error. -->
この場合、REST Assured はステータスコードの期待値との不一致だけを報告します。
2つ目の期待値を確認するには、もう1度テストを実行しなければならないのです。

#### Syntactic Sugar

<!-- Another thing worth mentioning is that REST Assured contains some methods that are only there for syntactic sugar. For example the "and" method which can add readability if you're writing everything in a one-liner, for example: -->
REST Assured を使う上で、いろいろ用意されている糖衣構文のことを説明しておくべきでしょう。
例えば、複数の要素を1行で記述するとき、`and` メソッドがあると可読性が高まります。

```java
given().param("x", "y").and().header("z", "w").when().get("/something").then().assertThat().statusCode(200).and().body("x.y", equalTo("z"));
```

<!-- This is the same thing as: -->
これは次のように記述したのと同じです。

```java
    given()
        .param("x", "y")
        .header("z", "w")
    .when()
        .get("/something")
    .then()
        .statusCode(200)
        .body("x.y", equalTo("z"));
```

## Getting Response Data

<!-- You can also get the content of a response. E.g. let's say you want to return the body of a get request to "/lotto". You can get it a variety of different ways: -->
レスポンス本文を取得できます。
例えば、`/lotto` への GET リクエストに対して、次のようにレスポンス本文を取得できます。

```java
InputStream stream = get("/lotto").asInputStream(); // Don't forget to close this one when you're done
byte[] byteArray = get("/lotto").asByteArray();
String json = get("/lotto").asString();
```

### Extracting values from the Response after validation

<!-- You can extract values from the response or return the response instance itself after you've done validating the response by using the `extract` method. This is useful for example if you want to use values from the response in sequent requests. For example given that a resource called `title` returns the following JSON -->
レスポンスを検証した後でも、`extract` メソッドでレスポンスのインスタンスやレスポンス本文を取得できます。
後続のリクエストで使いたい値がレスポンスに含まれているときは便利な機能です。
例えば、`/title` リソースが次のような JSON ドキュメントを返すことにしましょう。

```javascript
 {
     "title" : "My Title",
      "_links": {
              "self": { "href": "/title" },
              "next": { "href": "/title?page=2" }
           }
 }
```

<!-- and you want to validate that content type is equal to `JSON` and the title is equal to `My Title`
but you also want to extract the link to the `next` title to use that in a subsequent request. This is how: -->
コンテンツタイプが `JSON` であることと、`title` が `My Title` であることを確認してから、次にリクエストを送信するためのリンクを `next` から取得しなければならないとします。
その場合は次のように記述できます。

```java
String nextTitleLink =
    given()
        .param("param_name", "param_value")
    .when()
        .get("/title")
    .then()
        .contentType(JSON)
        .body("title", equalTo("My Title"))
    .extract()
        .path("_links.next.href");

get(nextTitleLink). ..
```

<!-- You could also decide to instead return the entire response if you need to extract multiple values from the response: -->
複数の値を抽出しなければならない場合はレスポンス全体のインスタンスを取得することもできます。

```java
Response response = 
    given().
        .param("param_name", "param_value")
    .when()
        .get("/title")
    .then()
        .contentType(JSON)
        .body("title", equalTo("My Title"))
    .extract()
        .response();

String nextTitleLink = response.path("_links.next.href");
String headerValue = response.header("headerName");
```

### JSON (using JsonPath)

<!-- Once we have the response body we can then use the [JsonPath](http://static.javadoc.io/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) to get data from the response body: -->
レスポンス本文があれば [JsonPath](http://static.javadoc.io/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) で自由に値を取得できます。

```java
int lottoId = from(json).getInt("lotto.lottoId");
List<Integer> winnerIds = from(json).get("lotto.winners.winnerId");
```

<!-- Or a bit more efficiently: -->
こちらの書き方のほうが効率的です。

```java
JsonPath jsonPath = new JsonPath(json).setRoot("lotto");
int lottoId = jsonPath.getInt("lottoId");
List<Integer> winnerIds = jsonPath.get("winners.winnderId");
```

<!-- Note that you can use `JsonPath` standalone without depending on REST Assured, see [getting started guide](GettingStarted) for more info on this. -->
`JsonPath` は REST Assured が無くても使用できます。
詳しくは [REST Assured 入門](GettingStarted) を参照してください。

#### JsonPath Configuration

<!-- You can configure object de-serializers etc for JsonPath by configuring it, for example: -->
`JsonPath` がオブジェクトをデシリアライズする振る舞いは変更できます。

```java
JsonPath jsonPath = new JsonPath(SOME_JSON).using(new JsonPathConfig("UTF-8"));
```

<!-- It's also possible to configure JsonPath statically so that all instances of JsonPath will shared the same configuration: -->
`JsonPath` の全てのインスタンスが共有するクラスメンバ変数で全体の設定を変更することもできます。

```java
JsonPath.config = new JsonPathConfig("UTF-8");
```

<!-- You can read more about JsonPath at [this blog](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/). -->
`JsonPath` について詳しくは [Jayway のブログ記事](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/) を参照してください。

<!-- Note that the JsonPath implementation uses <a href='http://groovy-lang.org/processing-xml.html#_gpath'>Groovy's GPath</a> syntax and is not to be confused with Jayway's <a href='https://github.com/jayway/JsonPath'>JsonPath</a> implementation. -->
ただし、`JsonPath` の実装は[Jayway の JsonPath](https://github.com/jayway/JsonPath) ではなく、[Groovy の GPath](http://groovy-lang.org/processing-xml.html#_gpath) を使っているので、間違えないようにしてください。

### XML (using XmlPath)

<!-- You also have the corresponding functionality for XML using  [XmlPath](http://static.javadoc.io/io.rest-assured/xml-path/latest/io/restassured/path/xml/XmlPath.html): -->
[XmlPath](http://static.javadoc.io/io.rest-assured/xml-path/latest/io/restassured/path/xml/XmlPath.html) を使うと REST Assured と同じような操作ができます。

```java
String xml = post("/greetXML?firstName=John&lastName=Doe").andReturn().asString();
// Now use XmlPath to get the first and last name
String firstName = from(xml).get("greeting.firstName");
String lastName = from(xml).get("greeting.firstName");

// or a bit more efficiently:
XmlPath xmlPath = new XmlPath(xml).setRoot("greeting");
String firstName = xmlPath.get("firstName");
String lastName = xmlPath.get("lastName");
```

<!-- Note that you can use `XmlPath` standalone without depending on REST Assured, see [getting started guide](GettingStarted) for more info on this. -->
`XmlPath` は REST Assured が無くても使用できます。
詳しくは [REST Assured 入門](GettingStarted) を参照してください。

#### XmlPath Configuration

<!-- You can configure object de-serializers and charset for XmlPath by configuring it, for example: -->
`XmlPath` がオブジェクトをデシリアライズする振る舞いは変更できます。

```java
XmlPath xmlPath = new XmlPath(SOME_XML).using(new XmlPathConfig("UTF-8"));
```

<!-- It's also possible to configure XmlPath statically so that all instances of XmlPath will shared the same configuration: -->
`XmlPath` の全てのインスタンスが共有するクラスメンバ変数で全体の設定を変更することもできます。

```java
XmlPath.config = new XmlPathConfig("UTF-8");
```

`XmlPath` について詳しくは [Jayway のブログ記事](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/) を参照してください。

#### Parsing HTML with XmlPath

<!-- By configuring XmlPath with [compatibility mode](http://static.javadoc.io/io.rest-assured/xml-path/latest/io/restassured/path/xml/XmlPath.CompatibilityMode.html) `HTML` you can also use the XmlPath syntax (Gpath) to parse HTML pages. For example if you want to extract the title of this HTML document: -->
`XmlPath` で [HTML互換モード](http://static.javadoc.io/io.rest-assured/xml-path/latest/io/restassured/path/xml/XmlPath.CompatibilityMode.html) を設定すると、`XmlPath` の記法（`GPath`）で HTML ページをパースできるようになります。
例えば、次のような HTML ドキュメントについて `title` 要素を取得したい場合について考えてみましょう。

```html
<html>
<head>
    <title>my title</title>
  </head>
  <body>
    <p>paragraph 1</p>
     <br>
    <p>paragraph 2</p>
  </body>
</html>
```

<!-- you can configure XmlPath like this: -->
`XmlPath` は次のように設定しておきましょう。

```java
String html = ...
XmlPath xmlPath = new XmlPath(CompatibilityMode.HTML, html);
```

<!-- and then extract the title like this: -->
そうすると、`title` 要素は次のように取得できます。

```java
xmlPath.getString("html.head.title"); // will return "mytitle"
```

<!-- In this example we've statically imported: `io.restassured.path.xml.XmlPath.CompatibilityMode.HTML`; -->
この例を実行するには `io.restassured.path.xml.XmlPath.CompatibilityMode.HTML` を static import しておく必要があります。

### Single path

<!-- If you only want to make a request and return a single path you can use a shortcut: -->
1つのリクエストに対して1つのパスだけが必要な場合は、次のような省略記法が利用できます。

```java
int lottoId = get("/lotto").path("lotto.lottoid");
```

<!-- REST Assured will automatically determine whether to use JsonPath or XmlPath based on the content-type of the response. If no content-type is defined then REST Assured will try to look at the [default parser](#default-parser) if defined. You can also manually decide which path instance to use, e.g. -->
REST Assured はレスポンスのコンテンツタイプから `JsonPath` と `XmlPath` のどちらを使用するのか自動的に判断します。
コンテンツタイプが存在しない場合は[既定のパーサー](#default-parser)の設定を参照します。
どちらを使用するのか明示的に指定することもできます。

```java
String firstName = post("/greetXML?firstName=John&lastName=Doe").andReturn().xmlPath().getString("firstName");
```

<!-- Options are `xmlPath`, `jsonPath` and `htmlPath`. -->
指定できる選択肢は `xmlPath` と `jsonPath` と `htmlPath` です。

### Headers, cookies, status etc

<!-- You can also get headers, cookies, status line and status code: -->
HTTP ヘッダーや HTTP Cookie、ステータスラインやステータスコードを取得できます。

```java
Response response = get("/lotto");

// Get all headers
Headers allHeaders = response.getHeaders();
// Get a single header value:
String headerName = response.getHeader("headerName");

// Get all cookies as simple name-value pairs
Map<String, String> allCookies = response.getCookies();
// Get a single cookie value:
String cookieValue = response.getCookie("cookieName");

// Get status line
String statusLine = response.getStatusLine();
// Get status code
int statusCode = response.getStatusCode();
```

### Multi-value headers and cookies

A header and a cookie can contain several values for the same name.
HTTP ヘッダーや HTTP Cookie は同じキーに複数の値を含む場合があります。

#### Multi-value headers

<!-- To get all values for a header you need to first get the [Headers](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Headers.html) object from the [Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) object. From the `Headers` instance you can get all values using the [Headers.getValues(<header name>)](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Headers.html#getValues(java.lang.String)) method which returns a `List` with all header values. -->
HTTP ヘッダーの全ての値を取得するには、最初に [Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) から [Headers](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Headers.html) を取得します。
`Headers` のインスタンスメソッド [Headers.getValues(<header name>)](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Headers.html#getValues(java.lang.String)) は全ての値の `List` を返します。

#### Multi-value cookies

<!-- To get all values for a cookie you need to first get the [Cookies](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Cookies.html) object from the [Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) object. From the `Cookies` instance you can get all values using the [Cookies.getValues(<cookie name>)](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Cookies.html#getValues(java.lang.String)) method which returns a `List` with all cookie values. -->
HTTP ヘッダーの全ての値を取得するには、最初に [Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) から [Cookies](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Cookies.html) を取得します。
`Cookies` のインスタンスメソッド [Cookies.getValues(<header name>)](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Cookies.html#getValues(java.lang.String)) は全ての値の `List` を返します。

### Detailed Cookies

<!-- If you need to get e.g. the comment, path or expiry date etc from a cookie you need get a [detailed cookie](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Cookie.html) from REST Assured. To do this you can use the [Response.getDetailedCookie(java.lang.String)](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/ResponseOptions.html#getDetailedCookie-java.lang.String-) method. The detailed cookie then contains all attributes from the cookie. -->
[Response.getDetailedCookie(java.lang.String)](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/ResponseOptions.html#getDetailedCookie-java.lang.String-) メソッドを使うと、コメント、パス、有効期限等の詳細な情報を全て含む、指定した名前の HTTP Cookie を取得できます。

<!-- You can also get all detailed response [cookies](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/http/Cookies.html) using the [Response.getDetailedCookies()](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/ResponseOptions.html#getDetailedCookies--) method. -->
[Response.getDetailedCookies()](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/ResponseOptions.html#getDetailedCookies--) メソッドを使うと、コメント、パス、有効期限等の詳細な情報を全て含む、全ての HTTP Cookie を取得できます。

## Specifying Request Data

<!-- Besides specifying request parameters you can also specify headers, cookies, body and content type. -->
リクエストオブジェクトには、リクエストパラメータと共に HTTP ヘッダーや HTTP Cookie、リクエストボディやコンテンツタイプを指定できます。

### Invoking HTTP resources

<!-- You typically perform a request by calling any of the "HTTP methods" in the [request specification](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/RequestSpecification.html). For example: -->
基本的には [リクエストの仕様](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/RequestSpecification.html) に定義された "HTTP リクエストメソッド" を呼び出すことでリクエストを送信できるようになっています。

```java
when().get("/x"). ..;
```

<!-- Where `get` is the HTTP request method. -->
この `get` は HTTP リクエストメソッドです。

<!-- As of REST Assured 3.0.0 you can use any HTTP verb with your request by making use of the [request](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/RequestSpecification.html#request-java.lang.String-java.lang.String-) method. -->
REST Assured 3.0.0 からは、[request](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/RequestSpecification.html#request-java.lang.String-java.lang.String-) メソッドに指定した任意の HTTP 述語でリクエストを送信できるようになりました。

```java
    when()
        .request("CONNECT", "/somewhere")
    .then()
        .statusCode(200);
```

<!-- This will send a "connect" request to the server. -->
このコード例では `CONNECT` リクエストをサーバーに送信します。

### Parameters

<!-- Normally you specify parameters like this: -->
リクエストパラメータは次のように指定します。

```java
    given()
        .param("param1", "value1")
        .param("param2", "value2")
    .when()
        .get("/something");
```

<!-- REST Assured will automatically try to determine which parameter type (i.e. query or form parameter) based on the HTTP method. In case of GET query parameters will automatically be used and in case of POST form parameters will be used. In some cases it's however important to separate between form and query parameters in a PUT or POST. You can then do like this: -->
REST Assured は HTTP リクエストメソッドに応じて、リクエストパラメータの種類（クエリパラメータやフォームパラメータ）を自動的に判断します。
この例では GET リクエストなのでクエリパラメータになります。
POST リクエストの場合はフォームパラメータになります。
PUT リクエストや POST リクエストではクエリパラメータをフォームパラメータを使い分ける必要があるため、次のように記述します。

```java
    given()
        .formParam("formParamName", "value1")
        .queryParam("queryParamName", "value2")
    .when()
        .post("/something");
```

<!-- Parameters can also be set directly on the url: -->
URL に直接クエリパラメータを埋め込むこともできます。

```java
    .when()
        .get("/name?firstName=John&lastName=Doe");
```

<!-- For multi-part parameters please refer to the [Multi-part form data](#multi-part-form-data) section. -->
マルチパート形式のパラメータを送信する方法は [マルチパートフォームデータ](#multi-part-form-data) を参照してください。

#### Multi-value parameter

<!-- Multi-value parameters are parameters with more then one value per parameter name (i.e. a list of values per name). You can specify these either by using var-args: -->
同じパラメータ名で複数の値を送信する場合は、それぞれの値を可変長引数として指定します。

```java
given().param("myList", "value1", "value2"). .. 
```

<!-- or using a list: -->
リストでも指定できます。

```java
List<String> values = new ArrayList<String>();
values.add("value1");
values.add("value2");

given().param("myList", values). .. 
```

#### No-value parameter

<!-- You can also specify a query, request or form parameter without a value at all: -->
パラメータ名だけを指定すると値を送信しないようにできます。

```java
given().param("paramName"). ..
```

#### Path parameters

<!-- You can also specify so called path parameters in your request, e.g. -->
リクエストを送信するURLにパスパラメータを埋め込むことができます。

```java
post("/reserve/{hotelId}/{roomNumber}", "My Hotel", 23);
```

<!-- These kinds of path parameters are referred to "unnamed path parameters" in REST Assured since they are index based (`hotelId` will be equal to "My Hotel" since it's the first placeholder). -->
REST Assured では前のコード例のような使い方を "名前無しパスパラメータ" と呼び、添え字で参照します（最初のプレースホルダは `"My Hotel"` なので `hotelId` には "My Hotel" が入ります）。

<!-- You can also use named path parameters: -->
名前有りパスパラメータもあります。

```java
    given()
        .pathParam("hotelId", "My Hotel")
        .pathParam("roomNumber", 23)
    .when().
        .post("/reserve/{hotelId}/{roomNumber}")
    .then()
             ..
```

<!-- Path parameters makes it easier to read the request path as well as enabling the request path to easily be re-usable in many tests with different parameter values. -->
パスパラメータを使うとリクエストURLを読みやすくなるし、複数のテストで再利用しやすくなります。

<!-- As of version 2.8.0 you can mix unnamed and named path parameters: -->
REST Assured 2.8.0 から、名前無しパスパラメータと名前有りパスパラメータを混在して利用できるようになりました。

```java
given().
        pathParam("hotelId", "My Hotel").        
when(). 
        post("/reserve/{hotelId}/{roomNumber}", 23).
then().
         ..
```

<!-- Here `roomNumber` will be replaced with `23`. -->
この場合、`rototNumber` は `23` になります。

<!-- Note that specifying too few or too many parameters will result in an error message. For advanced use cases you can add, change, remove (even redundant path parameters) from a [filter](#filters). -->
パスパラメータの数と、パラメータに指定した値の数が一致しないとエラーになります。
[filter](#filters)では、パスパラメータの追加や変更や削除（冗長なパラメータの削除等）を伴うより高度な使い方を説明しています。

### Cookies

<!-- In its simplest form you specify cookies like this: -->
HTTP Cookie を指定する最も簡単なやり方は次のとおりです。

```java
given().cookie("username", "John").when().get("/cookie").then().body(equalTo("username"));
```

<!-- You can also specify a multi-value cookie like this: -->
複数の HTTP Cookie を指定することもできます。

```java
given().cookie("cookieName", "value1", "value2"). ..
```

<!-- This will create _two_ cookies, `cookieName=value1` and `cookieName=value2`. -->
前のコード例は2つの HTTP Cookie を作成します（`cookieName=value1` と `cookieName=value2`）。

<!-- You can also specify a detailed cookie using: -->
HTTP Cookie の詳細情報を指定するときは次のように記述します。

```java
Cookie someCookie = new Cookie.Builder("some_cookie", "some_value").setSecured(true).setComment("some comment").build();
given().cookie(someCookie).when().get("/cookie").then().assertThat().body(equalTo("x"));
```

<!-- or several detailed cookies at the same time: -->
複数の HTTP Cookie を同時に指定できます。

```java
Cookie cookie1 = Cookie.Builder("username", "John").setComment("comment 1").build();
Cookie cookie2 = Cookie.Builder("token", 1234).setComment("comment 2").build();
Cookies cookies = new Cookies(cookie1, cookie2);
given().cookies(cookies).when().get("/cookie").then().body(equalTo("username, token"));
```

### Headers

```java
given().header("MyHeader", "Something").and(). ..
given().headers("MyHeader", "Something", "MyOtherHeader", "SomethingElse").and(). ..
```

<!-- You can also specify a multi-value headers like this: -->
HTTP ヘッダーには複数の値を設定できます。

```java
given().header("headerName", "value1", "value2"). ..
```

<!-- This will create _two_ headers, `headerName: value1` and `headerName: value2`. -->
前のコード例は2つの HTTP ヘッダーを作成します（`headerName=value1` と `headerName=value2`）。

##### Header Merging/Overwriting

By default headers are merged. So for example if you do like this:
初期設定では指定された HTTP ヘッダーはマージするようになっています。
例えば、次のように記述した場合、HTTP リクエストには2つの HTTP ヘッダー（`x: 1` と `x: 2`）が含まれることになります。

```java
given().header("x", "1").header("x", "2"). ..
```

<!-- The request will contain two headers, "x: 1" and "x: 2". You can change in this on a per header basis in the [HeaderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/HeaderConfig.html). For example: -->
HTTP ヘッダーをマージするかどうかは [HeaderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/HeaderConfig.html) で変更できます。
この場合送信する HTTP ヘッダーとして送信するのは `x: 2` です。

```java
given().
        config(RestAssuredConfig.config().headerConfig(headerConfig().overwriteHeadersWithName("x"))).
        header("x", "1").
        header("x", "2").
when().
        get("/something").
...
```

<!-- This means that only one header, "x: 2", is sent to server. -->

### Content Type

```java
given().contentType(ContentType.TEXT). ..
given().contentType("application/json"). ..
```


### Request Body

```java
given().body("some body"). .. // Works for POST, PUT and DELETE requests
given().request().body("some body"). .. // More explicit (optional)
```

```java
given().body(new byte[]{42}). .. // Works for POST, PUT and DELETE
given().request().body(new byte[]{42}). .. // More explicit (optional)
```

<!-- You can also serialize a Java object to JSON or XML. Click [here](#serialization) for details. -->
[serialization](#serialization) では Java オブジェクトを JSON ドキュメントや XML ドキュメントへシリアライズする方法を説明しています。

## Verifying Response Data

<!-- You can also verify status code, status line, cookies, headers, content type and body. -->
HTTP レスポンスについて検証できるのは、ステータスコードやステータスライン、HTTP Cookie、HTTP ヘッダー、コンテンツタイプ、レスポンス本文です。

### Response Body

<!-- See Usage examples, e.g. [JSON](#example-1---json) or [XML](#example-2---xml). -->
[JSON ドキュメント](#example-1---json) や [XML ドキュメント](#example-2---xml) の具体例を参照してください。

<!-- You can also map a response body to a Java Object, click [here](#deserialization) for details. -->
レスポンス本文を Java オブジェクトに写像することもできます。
詳しくは [deserialization](#deserialization) を参照してください。

### Cookies

```java
get("/x").then().assertThat().cookie("cookieName", "cookieValue"). ..
get("/x").then().assertThat().cookies("cookieName1", "cookieValue1", "cookieName2", "cookieValue2"). ..
get("/x").then().assertThat().cookies("cookieName1", "cookieValue1", "cookieName2", containsString("Value2")). ..
```

### Status

```java
get("/x").then().assertThat().statusCode(200). ..
get("/x").then().assertThat().statusLine("something"). ..
get("/x").then().assertThat().statusLine(containsString("some")). ..
```


### Headers

```java
get("/x").then().assertThat().header("headerName", "headerValue"). ..
get("/x").then().assertThat().headers("headerName1", "headerValue1", "headerName2", "headerValue2"). ..
get("/x").then().assertThat().headers("headerName1", "headerValue1", "headerName2", containsString("Value2")). ..
```

<!-- It's also possible to use a mapping function when validating headers. For example let's say you want to validate that the `Content-Length` header is less than 1000. You can then use a mapping function to first convert the header value to an int and then use an `Integer` before validating it with a Hamcrest matcher: -->
HTTP ヘッダーを検証するときは写像関数も利用できます。
例えば、`Content-Length` ヘッダーの値が `1000` 未満であることを確認するなら、ヘッダーの値を `int` へ変換し、`Integer` として `Hamcrest` マッチャーに渡すようにできます。

```java
get("/something").then().assertThat().header("Content-Length", Integer::parseInt, lessThan(1000));
```

### Content-Type

```java
get("/x").then().assertThat().contentType(ContentType.JSON). ..
```


### Full body/content matching

```java
get("/x").then().assertThat().body(equalTo("something")). ..
```

### Use the response to verify other parts of the response

You can use data from the response to verify another part of the response. For example consider the following JSON document returned from service x:
レスポンスから取得したデータを、レスポンスの他の部分の検証に使うことができます。
例えばあるサービスが次のような JSON ドキュメントを返したことにしましょう。

```javascript
{ "userId" : "some-id", "href" : "http://localhost:8080/some-id" }
```

<!-- You may notice that the "href" attribute ends with the value of the "userId" attribute. If we want to verify this we can implement a `io.restassured.matcher.ResponseAwareMatcher` and use it like this: -->
このとき、"href" 属性の値が "userId" 属性の値で終端しているか確かめたいことにします。
そういうときは、`io.restassured.matcher.ResponseAwareMatcher` で次のように記述します。

```java
get("/x").then().body("href", new ResponseAwareMatcher<Response>() {
                                  public Matcher<?> matcher(Response response) {
                                      return equalTo("http://localhost:8080/" + response.path("userId"));
                                  }
                              });
```

<!-- If you're using Java 8 you can use a lambda expression instead: -->
Java 8 を使っているなら代わりにラムダ式を使うことが出来ます。

```java
get("/x").then().body("href", response -> equalTo("http://localhost:8080/" + response.path("userId")));
```

<!-- There are some predefined matchers that you can use defined in the `io.restassured.matcher.RestAssuredMatchers` (or `io.restassured.module.mockmvc.matcher.RestAssuredMockMvcMatchers` if using the spring-mock-mvc module). For example: -->
`io.restassured.matcher.RestAssuredMatchers` には定義済みのいろいろなマッチャーがあります。
Spring Mock MVC モジュールを使っているなら `io.restassured.module.mockmvc.matcher.RestAssuredMockMvcMatchers` を使いましょう。

```java
get("/x").then().body("href", endsWithPath("userId"));
```

<!-- `ResponseAwareMatchers` can also be composed, either with another `ResponseAwareMatcher` or with a Hamcrest Matcher. For example: -->
`ResponseAwareMatchers` のマッチャーメソッドは、他のマッチャーメソッドや `Hamcrest` のマッチャーメソッドと組み合わせることができます。

```java
get("/x").then().body("href", and(startsWith("http:/localhost:8080/"), endsWithPath("userId")));
```

<!-- The `and` method is statically imported from `io.restassured.matcher.ResponseAwareMatcherComposer`. -->
`and` メソッドは `io.restassured.matcher.ResponseAwareMatcherComposer` のクラスメソッドです。

### Measuring Response Time

<!-- As of version 2.8.0 REST Assured has support measuring response time. For example: -->
REST Assured 2.8.0 から応答時間を計測できるようになりました。

```java
long timeInMs = get("/lotto").time()
```

<!-- or using a specific time unit: -->
時間単位を指定することもできます。

```java
long timeInSeconds = get("/lotto").timeIn(SECONDS);
```

<!-- where `SECONDS` is just a standard `TimeUnit`. You can also validate it using the validation DSL: -->
`SECONDS` は `TimeUnit` の列挙値です。
応答時間の計測にバリデーション DSL を組み合わせることもできます。

```java
when().
      get("/lotto").
then().
      time(lessThan(2000L)); // Milliseconds
```

時間単位も指定できます。

```java
when().
      get("/lotto").
then().
      time(lessThan(2L), SECONDS);
```

<!-- Please note that response time measurement should be performed when the JVM is hot! (i.e. running a response time measurement when only running a single test will yield erroneous results). Also note that you can only vaguely regard these measurments to correlate with the server request processing time (since the response time will include the HTTP round trip and REST Assured processing time among other things). -->
応答時間の計測は JVM が十分に暖まっている状態で行うようにしてください（単発のテストで計測しても不正確な結果しか得られません）。
また、計測値はサーバーの処理時間を厳密に保証するものではありません（HTTP の往復時間や REST Assured の処理時間などを含むため）。

## Authentication

<!-- REST assured also supports several authentication schemes, for example OAuth, digest, certificate, form and preemptive basic authentication. You can either set authentication for each request: -->
REST Assured はさまざまな認証方式に対応しています。
具体的には OAuth、Digest認証、証明書、フォーム認証、プリエンプティブベーシック認証等です。
認証方式はそれぞれのリクエストに指定できます。

```java
given().auth().basic("username", "password"). ..
```

<!-- but you can also define authentication for all requests: -->
全てのリクエストで使用する認証方式を指定することもできます。

```java
RestAssured.authentication = basic("username", "password");
```

<!-- or you can use a [specification](#specification-re-use). -->
他にも、[リクエストやレスポンスの仕様](#specification-re-use) として指定することができます。

### Basic Authentication

<!-- There are two types of basic authentication, preemptive and "challenged basic authentication". -->
ベーシック認証には2種類あります。
1つは「プリエンプティブベーシック認証」、もう1つは「チャレンジベーシック認証」です。

#### Preemptive Basic Authentication

<!-- This will send the basic authentication credential even before the server gives an unauthorized response in certain situations, thus reducing the overhead of making an additional connection. This is typically what you want to use in most situations unless you're testing the servers ability to challenge. Example:
 -->余計な接続をする負担を減らすため、特定の時点でサーバーが 404(Unauthorized) レスポンスステータスを返す前に、資格情報を送信する方式です。
サーバーがチャレンジを処理する能力をテストする場合を除いて、ほとんどの場面で使われることになります。

```java
given().auth().preemptive().basic("username", "password").when().get("/secured/hello").then().statusCode(200);
```

#### Challenged Basic Authentication

<!-- When using "challenged basic authentication" REST Assured will not supply the credentials unless the server has explicitly asked for it. This means that REST Assured will make an additional request to the server in order to be challenged and then follow up with the same request once more but this time setting the basic credentials in the header. -->
「チャレンジベーシック認証」を使う場合、サーバーが明示的に要求しない限り、REST Assured は資格情報を提供しません。
つまり、REST Assured は最初にチャレンジのためのリクエストを送信してから、資格情報を HTTP ヘッダーに設定したリクエストを送信するのです。

```java
given().auth().basic("username", "password").when().get("/secured/hello").then().statusCode(200);
```

### Digest Authentication

<!-- Currently only "challenged digest authentication" is supported. Example: -->
今のところ「チャレンジダイジェスト認証」にだけ対応しています。

```java
given().auth().digest("username", "password").when().get("/secured"). ..
```

### Form Authentication

<!-- [Form authentication](https://en.wikipedia.org/wiki/Form-based_authentication) is very popular on the internet. It's typically associated with a user filling out his credentials (username and password) on a webpage and then pressing a login button of some sort. A very simple HTML page that provide the basis for form authentication may look like this: -->
[フォーム認証](https://en.wikipedia.org/wiki/Form-based_authentication) はインターネットで非常に広く使われている方式です。
ユーザーはWebページで資格情報（ユーザー名とパスワード）を入力し、ログインボタンで送信します。
フォーム認証のための必要最小限のWebページは次のようになるでしょう。

```html
<html>
  <head>
    <title>Login</title>
  </head>

  <body>
    <form action="j_spring_security_check" method="POST">
      <table>
        <tr><td>User:&nbsp;</td><td><input type='text' name='j_username'></td></tr>
        <tr><td>Password:</td><td><input type='password' name='j_password'></td></tr>
          <tr><td colspan='2'><input name="submit" type="submit"/></td></tr>
       </table>
        </form>
      </body>
 </html>
```

<!-- I.e. the server expects the user to fill-out the "j_username" and "j_password" input fields and then press "submit" to login. With REST Assured you can test a service protected by form authentication like this: -->
サーバーは、ユーザーが "j_username" フィールドと "j_password" フィールトを入力して "submit" ボタンをクリックすることを期待しています。
フォーム認証で保護されたサービスを REST Assured でテストするには次のように記述します。

```java
    given().
        .auth().form("John", "Doe")
    .when()
        .get("/formAuth")
    .then()
        .statusCode(200);
```

<!-- While this may work it's not optimal. What happens when form authentication is used like this in REST Assured an additional request have to made to the server in order to retrieve the webpage with the login details. REST Assured will then try to parse this page and look for two input fields (with username and password) as well as the form action URI. This may work or fail depending on the complexity of the webpage. A better option is to supply the these details when setting up the form authentication. In this case one could do: -->
最適な動作をするわけではありません。
このように記述した場合、REST Assured はログインページを取得するための余計なリクエストを送信するからです。
REST Assured は取得したWebページを解析し、ユーザー名とパスワードに対応する入力フィールドと、フォームアクションURIを探索します。
Webページの複雑さによって解析に失敗する場合もあります。
フォーム認証を構成するときは、あらかじめ解析して得られるはずの情報を指定したほうがよいです。
例えば次のように記述します。

```java
    given()
        .auth()
        .form("John", "Doe", new FormAuthConfig("/j_spring_security_check", "j_username", "j_password"))
    .when()
        .get("/formAuth")
    .then()
        .statusCode(200);
```

<!-- This way REST Assured doesn't need to make an additional request and parse the webpage. There's also a predefined FormAuthConfig called `springSecurity` that you can use if you're using the default Spring Security properties: -->
この場合 REST Assured はログインページを取得し、解析するためのリクエストを送信する必要がありません。
Spring Security が初期設定で構成されているなら、`FormAuthConfig` に定義済みの `springSecurity` を使うことができます。

```java
    given()
        .auth().form("John", "Doe", FormAuthConfig.springSecurity())
    .when()
        .get("/formAuth")
    .then()
        .statusCode(200);
```

#### CSRF

<!-- Today it's common for the server to supply a [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) token with the response in order to avoid these kinds of attacks. REST Assured has support for automatically parsing and supplying the CSRF token to the server. In order for this to work REST Assured *must* make an additional request and parse (parts) of the website. -->
サーバーのレスポンスに [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) 対策のためのトークン値を含めるのが一般的になっています。
REST Assured はサーバーから受信した CSRF トークンを自動的に解釈するようになっていますが、そのためには *必ず* Webページ（Webサイトの一部）を取得するリクエストを送信しなければなりません。

<!-- You can enable CSRF support by doing the following: -->
CSRF 機能は次のように有効化します。

```java
    given()
        .auth().form("John", "Doe", formAuthConfig().withAutoDetectionOfCsrf())
    .when()
        .get("/formAuth")
    .then()
        .statusCode(200);
```

<!-- Now REST Assured will automatically try to detect if the webpage contains a CSRF token. In order to assist REST Assured and make the parsing more robust it's possible to supply the CSRF field name (here we imagine that we're using Spring Security default values and thus can make use of the predefined `springSecurity` FormAuthConfig): -->
この場合、REST Assured は自動的にWebページを解析してCSRFトークンを探索します。
より正確にCSRFトークンを探索できるようにするため、REST Assured にフィールド名を指定することができます。
次のコード例は、Spring Security が初期設定で構成されているものとして、`FormAuthConfig` に定義済みの `springSecurity` を使用し、"_csrf" で終わるフィールド名を CSRF トークンの設定されたフィールドとして探索させています。

```java
    given()
        .auth().form("John", "Doe", springSecurity().withCsrfFieldName("_csrf"))
    .when()
        .get("/formAuth")
    .then()
        .statusCode(200);
```

<!-- We've now told REST Assured to search for the CSRF field name called "_csrf" (which is it both faster and less prone to error). -->

<!-- By default the CSRF value is sent as a form parameter with the request but you can configure to send it as a header instead if that's required: -->
初期設定では、CSFR トークンをフォームパラメータとして送信するようになっています。
ただし、必要に応じて HTTP ヘッダーとして送信するように設定することができます。

```java
    given()
        .auth().form("John", "Doe", springSecurity().withCsrfFieldName("_csrf").sendCsrfTokenAsHeader())
    .when()
        .get("/formAuth")
    .then()
        .statusCode(200);
```

#### Include additional fields in Form Authentication

<!-- Since version 3.1.0 REST Assured can include additional input fields when using form authentication. Just use the `FormAuthConfig` and specify the additional values to include. For example if you have an html page that looks like this: -->
REST Assured 3.1.0 からフォーム認証へ入力フィールドを追加できるようになりました。
`FormAuthConfig` に追加するフィールドを指定するだけです。
例えば、次のようなWebページがあるとします。

```html
<html>
<head>
   <title>Login</title>
</head>
<body>
<form action="/login" method="POST">
   <table>
       <tr>
           <td>User:&nbsp;</td>
           <td><input type="text" name="j_username"></td>
       </tr>
       <tr>
           <td>Password:</td>
           <td><input type="password" name="j_password"></td>
       </tr>
       <tr>
           <td colspan="2"><input name="submit" type="submit"/></td>
       </tr>
   </table>
   <input type="hidden" name="firstInputField" value="value1"/>
   <input type="hidden" name="secondInputField" value="value2"/>
</form>
</body>
</html>
```

<!-- and you'd like to include the value of form parameters `firstInputField` and `secondInputField` you can do like this: -->
そして、`firstInputField` と `secondInputField` を追加したいときは、次のように記述します。

```java
given().auth().form("username", "password",
    formAuthConfig().withAdditionalFields("firstInputField", "secondInputField")). ..
```

<!-- REST Assured will automatically parse the HTML page, find the values for the additional fields and include them as form parameters in the login request. -->
REST Assured は自動的にWebページを解析し、指定したフィールドを探索し、発見した値をログインリクエストのフォームパラメータへ設定します。

### OAuth

<!-- In order to use OAuth 1 and OAuth 2 (for query parameter signing) you need to add [Scribe](https://github.com/fernandezpablo85/scribe-java) to your classpath (if you're using version 2.1.0 or older of REST Assured then please refer to the [legacy](Usage_Legacy#OAuth) documentation). In Maven you can simply add the following dependency: -->
OAuth 1 や OAuth 2（クエリパラメータに署名する）を使用するには、クラスパスに [ScribeJava](https://github.com/scribejava/scribejava) を追加しなければなりません。
あなたのプロジェクトが Maven を使っているなら次のような依存ライブラリを追加します。
Maven を使っていない場合は [GitHub のリリース](https://github.com/scribejava/scribejava/releases) から取得した jar ファイルをクラスパスに配置します。

```xml
<dependency>
            <groupId>com.github.scribejava</groupId>
            <artifactId>scribejava-apis</artifactId>
            <version>8.3.1</version>
            <scope>test</scope>
</dependency>
```

<!-- If you're not using Maven [download](https://github.com/fernandezpablo85/scribe-java/releases) a Scribe release manually and put it in your classpath. -->

#### OAuth 1

<!-- OAuth 1 requires [Scribe](#oauth) in the classpath. To use auth 1 authentication you can do: -->
OAuth 1 を使用するにはクラスパスに [ScribeJava](#oauth) が必要です。
認証処理は次のように記述します。

```java
given().auth().oauth(..). ..
```

#### OAuth 2

<!-- Since version `2.5.0` you can use OAuth 2 authentication without depending on [Scribe](#oauth): -->
REST Assured 2.5.0 から、OAuth 2 を使用するときに [ScribeJava](#oauth) へ依存しなくなりました。

```java
given().auth().oauth2(accessToken). ..
```

<!-- This will put the OAuth2 `accessToken` in a header. To be more explicit you can also do: -->
このように記述すると、OAuth 2 の `accessToken` を HTTP ヘッダーに埋め込むことができます。
明示的に次のように記述することもできます。

```java
given().auth().preemptive().oauth2(accessToken). ..
```

<!-- There reason why `given().auth().oauth2(..)` still exists is for backward compatibility (they do the same thing). If you need to provide the OAuth2 token in a query parameter you currently need [Scribe](#oauth) in the classpath. Then you can do like this: -->
`given().auth().oauth2(..)` という記法は後方互換性のために残されています（やっている内容は同じです）。
OAuth 2 トークンをクエリパラメータで送信させたいときは、クラスパスに [ScribeJava](#oauth) を配置して、次のように記述します。

```java
given().auth().oauth2(accessToken, OAuthSignature.QUERY_STRING). ..
```

### Custom Authentication

<!-- Rest Assured allows you to create custom authentication providers. You do this by implementing the `io.restassured.spi.AuthFilter` interface (preferably) and apply it as a [filter](#filters). For example let's say that your security consists of adding together two headers together in a new header called "AUTH" (this is of course not secure). Then you can do that like this (Java 8 syntax): -->
REST Assured では独自の認証プロバイダーを使用できます。
そのためには、`io.restassured.spi.AuthFilter` インターフェイスを実装したクラスを [filter](#filters) に指定します。
例えば、決して安全性を高める方法ではありませんが、あなたのサービスが独自の HTTP ヘッダー "AUTH" に、2種類の HTTP ヘッダーの値を組み合わせた値を要求するなら、次のように記述します。

```java
    given()
        .filter((requestSpec, responseSpec, ctx) -> {
            String header1 = requestSpec.getHeaders().getValue("header1");
            String header2 = requestSpec.getHeaders().getValue("header2");
            requestSpec.header("AUTH", header1 + header2);
            return ctx.next(requestSpec, responseSpec);
        })
    .when()
        .get("/customAuth")
    .then()
        .statusCode(200);
```

<!-- The reason why you want to use a `AuthFilter` and not `Filter` is that `AuthFilters` are automatically removed when doing `given().auth().none(). ..`. -->
`Filter` ではなく `AuthFilter` を使用するべき理由は、`given().auth().none(). ..` のように記述した場合、`AuthFilters` が自動的に除去してくれるからです。

## Multi-part form data

<!-- When sending larger amount of data to the server it's common to use the multipart form data technique. Rest Assured provide methods called `multiPart` that allows you to specify a file, byte-array, input stream or text to upload. In its simplest form you can upload a file like this: -->
巨大なデータをサーバーに送信するときは、マルチパート形式で送信するのが一般的です。
REST Assured では `multiPart` メソッドを使って、ファイルやバイト配列、入力ストリームや文字列を送信できます。
例えば、次のように記述すると簡単にファイルをアップロードできます。

```java
    given()
        .multiPart(new File("/path/to/file"))
    when()
        .post("/upload");
```

<!-- It will assume a control name called "file". In HTML the control name is the attribute name of the input tag. To clarify let's look at the following HTML form: -->
このコード例では、マルチパート形式のデータ構造において、あるコンテンツに対応する部分の名前が "file" になります。
HTML では input タグの name 属性が使われます。
次のような HTML について考えてみましょう。

```html
<form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" size="40">
        <input type=submit value="Upload!">
</form>
```

<!-- The control name in this case is the name of the input tag with name "file". If you have a different control name then you need to specify it: -->
この場合、input タグの name 属性が "file" なので、あるコンテンツに対応する部分の名前は "file" になります。
別の名前にするときは次のように記述します。

```java
    given()
        .multiPart("controlName", new File("/path/to/file"))
    .when()
        .post("/upload");
```

<!-- It's also possible to supply multiple "multi-parts" entities in the same request: -->
同じリクエストで複数のコンテンツを送信するときは次のように記述します。

```java
byte[] someData = ..
given()
    .multiPart("controlName1", new File("/path/to/file"))
    .multiPart("controlName2", "my_file_name.txt", someData)
    .multiPart("controlName3", someJavaObject, "application/json")
.when()
    .post("/upload");
```

<!-- For more advanced use cases you can make use of the [MultiPartSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/MultiPartSpecBuilder.html). For example: -->
より複雑な制御が必要なときは [MultiPartSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/MultiPartSpecBuilder.html) を使います。

```java
Greeting greeting = new Greeting();
greeting.setFirstName("John");
greeting.setLastName("Doe");

given()
    .multiPart(new MultiPartSpecBuilder(greeting, ObjectMapperType.JACKSON_2)
        .fileName("greeting.json")
        .controlName("text")
        .mimeType("application/vnd.custom+json").build())
.when()
    .post("/multipart/json")
.then()
    .statusCode(200);
```

<!-- You can specify, among other things, the default `control name` and filename using the [MultiPartConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/MultiPartConfig.html). For example: -->
特に、コンテンツに対応する名前の初期値やファイル名を変更したい場合は [MultiPartConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/MultiPartConfig.html) を構成します。

```java
given().config(config().multiPartConfig(multiPartConfig().defaultControlName("something-else"))). ..
```

<!-- This will configure the default control name to be "something-else" instead of "file". -->
このコード例では、コンテンツに対応する名前が "file" ではなく "something-else" になります。

<!-- For additional info refer to [this](http://blog.jayway.com/2011/09/15/multipart-form-data-file-uploading-made-simple-with-rest-assured/) blog post. -->
より詳しい内容は [JayWay のブログ記事](http://blog.jayway.com/2011/09/15/multipart-form-data-file-uploading-made-simple-with-rest-assured/) を参照してください。

## Object Mapping

<!-- REST Assured supports mapping Java objects to and from JSON and XML. For JSON you need to have either Jackson, Jackson2, Gson or Johnzon in the classpath and for XML you need JAXB. -->
REST Assured は Java オブジェクトと JSON および XML を相互変換できるようになっています。
JSON を処理するにはクラスパスに Jackson や Jackson2、Gson や Johnzon の jar ファイルを配置しなければなりません。
また、XML を処理するには JAXB が必要です。

### Serialization

<!-- Let's say we have the following Java object: -->
次のような Java オブジェクトを JSON にシリアライズして送信する方法がいろいろあります。

```java
public class Message {
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

<!-- and you want to serialize this object to JSON and send it with the request. There are several ways to do this, e.g: -->

#### Content-Type based Serialization

```java
Message message = new Message();
message.setMessage("My messagee");
given()
    .contentType("application/json")
    .body(message)
.when()
    .post("/message");
```

<!-- In this example REST Assured will serialize the object to JSON since the request content-type is set to "application/json". It will first try to use Jackson if found in classpath and if not Gson will be used. If you change the content-type to "application/xml" REST Assured will serialize to XML using JAXB. If no content-type is defined REST Assured will try to serialize in the following order: -->
このコード例では、リクエストに指定した HTTP ヘッダー content-type の値である "application/json" に従って、オブジェクトを JSON にシリアライズします。
最初はクラスパスから Jackson を探索し、無ければ Gson を使います。
content-type の値を "application/xml" にすると、JAXB を使用して XML へシリアライズします。
content-type を指定しなかった場合は、次の順にシリアライズを試みます。

1. JSON using Jackson 2 (Faster Jackson (databind))
1. JSON using Jackson (databind)
1. JSON using Gson
1. JSON using Johnzon
1. JSON-B using Eclipse Yasson
1. XML using JAXB

<!-- REST Assured also respects the charset of the content-type. E.g. -->
REST Assured は content-type に含まれる charset も考慮します。

```java
Message message = new Message();
message.setMessage("My messagee");
given()
    .contentType("application/json; charset=UTF-16")
    .body(message)
.when()
    .post("/message");
```

<!-- You can also serialize the `Message` instance as a form parameter: -->
`Message` クラスのインスタンスをフォームパラメータへシリアライズすることもできます。

```java
Message message = new Message();
message.setMessage("My messagee");
given()
    .contentType("application/json; charset=UTF-16")
    .formParam("param1", message)
.when()
    .post("/message");
```

<!-- The message object will be serialized to JSON using Jackson (databind) (if present) or Gson (if present) with UTF-16 encoding. -->
このコード例では、文字エンコーディングを UTF-16 として、Jackson (databind) あるいは Gson で JSON へシリアライズします。

#### Create JSON from a HashMap

<!-- You can also create a JSON document by supplying a Map to REST Assured. -->
Map のインスタンスから JSON ドキュメントを作成できます。

```java
Map<String, Object>  jsonAsMap = new HashMap<>();
jsonAsMap.put("firstName", "John");
jsonAsMap.put("lastName", "Doe");

given()
    .contentType(JSON)
    .body(jsonAsMap)
.when()
    .post("/somewhere")
.then()
    .statusCode(200);
```

<!-- This will provide a JSON payload as: -->
このコード例は、次のような JSON ドキュメントをリクエスト本文として送信します。

```javascript
{ "firstName" : "John", "lastName" : "Doe" }
```

#### Using an Explicit Serializer

<!-- If you have multiple object mappers in the classpath at the same time or don't care about setting the content-type you can specify a serializer explicity. E.g. -->
クラスパスに複数のオブジェクトマッピングライブラリが存在する場合や、content-type の値を無視させたい場合は、明示的にシリアライザーを指定します。

```java
Message message = new Message();
message.setMessage("My messagee");
given()
   .body(message, ObjectMapperType.JAXB)
.when()
  .post("/message");
```

<!-- In this example the Message object will be serialized to XML using JAXB. -->
このコード例では message オブジェクトを JAXB で XML へシリアライズします。

### Deserialization

<!-- Again let's say we have the following Java object: -->
レスポンス本文を、Java オブジェクトにデシリアライズする方法もいろいろあります。

```java
public class Message {
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

<!-- and we want the response body to be deserialized into a Message object. -->

#### Content-Type based Deserialization

<!-- Let's assume then that the server returns a JSON body like this: -->
サーバーから次のような JSON ドキュメントを受信したことにします。

```javascript
{"message":"My message"}
```

<!-- To deserialize this to a Message object we simply to like this: -->
Message クラスのオブジェクトへデシリアライズするには次のように記述します。

```java
Message message = get("/message").as(Message.class);
```

<!-- For this to work the response content-type must be "application/json" (or something that contains "json"). If the server instead returned -->
この場合、受信した HTTP ヘッダー content-type の値は "application/json" でなければなりません（"json" を含む値ならなんでも構いません）。

一方、サーバーから次のような XML ドキュメントを受信したことにします。

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<message>
      <message>My message</message>
</message>
```

<!-- and a content-type of "application/xml" you wouldn't have to change the code at all: -->
この場合、受信した HTTP ヘッダー content-type の値は "application/xml" でなければなりません。
同じコードのままで動作します。

```java
Message message = get("/message").as(Message.class);
```

##### Custom Content-Type Deserialization

<!-- If the server returns a custom content-type, let's say "application/something", and you still want to use the object mapping in REST Assured there are a couple of different ways to go about. You can either use the [explicit](http://code.google.com/p/rest-assured/wiki/Usage#Using_an_Explicit_Deserializer) approach or register a parser for the custom content-type: -->
サーバーから受信した content-type の値が "application/something" のように独自の値でも、いろいろな方法で Java オブジェクトへデシリアライズさせることができます。
具体的には、[明示的に指定する方法](#using-an-explicit-deserializer)や、独自の content-type に対応するパーサーを登録する方法があります。

content-type に対応するパーサーを登録するには次のように記述します。

```java
Message message = expect().parser("application/something", Parser.XML).when().get("/message").as(Message.class);
```

<!-- or -->
既定のパーサーを登録するには次のように記述します。
既定のパーサーは、[クラスメンバ変数](#default-values) へ登録することもできますし、[レスポンスの仕様](#specification-re-use) として登録することもできます。

```java
Message message = expect().defaultParser(Parser.XML).when().get("/message").as(Message.class);
```

<!-- You can also register a default or custom parser [statically](#default-values) or using [specifications](#specification-re-use). -->

#### Using an Explicit Deserializer

<!-- If you have multiple object mappers in the classpath at the same time  or don't care about the response content-type you can specify a deserializer explicitly. E.g. -->
クラスパスに複数のオブジェクトマッピングライブラリが存在する場合や、content-type の値を無視させたい場合は、明示的にデシリアライザーを指定します。

```java
Message message = get("/message").as(Message.class, ObjectMapperType.GSON);
```

### Configuration

<!-- You can configure the pre-defined object mappers by using a [ObjectMapperConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ObjectMapperConfig.html) and pass it to [detailed configuration](#detailed-configuration). For example to change GSON to use lower case with underscores as field naming policy you can do like this: -->
既定のオブジェクトマッパーは [ObjectMapperConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ObjectMapperConfig.html) で設定できます。
また、`ObjectMapperConfig` は [詳細設定](#detailed-configuration) へ指定できます。
例えば、Gson のフィールド名規則を小文字とアンダースコアで構成するには次のように記述します。

```java
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(objectMapperConfig().gsonObjectMapperFactory(
                new GsonObjectMapperFactory() {
                    public Gson create(Class cls, String charset) {
                        return new GsonBuilder().setFieldNamingPolicy(LOWER_CASE_WITH_UNDERSCORES).create();
                    }
                }
        ));
```

<!-- There are pre-defined object mapper factories for GSON, JAXB, Jackson, Faster Jackson and Eclipse Yasson (JSON-B). -->
REST Assured は Gson、JAXB、Jackson、Jackson2、Eclipse Yasson（JSON-B）のための定義済みファクトリクラスを提供しています。

### Custom

<!-- By default REST Assured will scan the classpath to find various object mappers. If you want to integrate an object mapper that is not supported by default or if you've rolled your own you can implement the
[io.restassured.mapper.ObjectMapper](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/mapper/ObjectMapper.html) interface. You tell REST Assured to use your object mapper either by passing it as a second parameter to the body: -->
REST Assured はクラスパスを探索して利用可能なオブジェクトマッパーを判断します。
未対応のオブジェクトマッパーを利用したい場合は、[io.restassured.mapper.ObjectMapper](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/mapper/ObjectMapper.html) の独自実装を、`body` メソッドの第二引数へ指定します。

```java
given().body(myJavaObject, myObjectMapper).when().post("..")
```

<!-- or you can define it statically once and for all: -->
クラスメンバ変数へ設定すれば、全ての呼び出しから利用させることができます。

```java
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(new ObjectMapperConfig(myObjectMapper));
```

<!-- For an example see [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/CustomObjectMappingITest.java). -->
具体例は [ソースコード](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/CustomObjectMappingITest.java) で確認してください。

## Parsers

### Custom

<!-- REST Assured providers predefined parsers for e.g. HTML, XML and JSON. But you can parse other kinds of content by registering a predefined parser for unsupported content-types by using: -->
REST Assured は HTML、XML、JSON の定義済みパーサーを提供します。
また、REST Assured が未対応の content-type に対応するパーサーを登録することもできます。

```java
RestAssured.registerParser(<content-type>, <parser>);
```

<!-- E.g. to register that mime-type 'application/vnd.uoml+xml' should be parsed using the XML parser do: -->
MIMEタイプ "application/vnd.uoml+xml" を XML パーサーで解析させるときは次のように記述します。

```java
RestAssured.registerParser("application/vnd.uoml+xml", Parser.XML);
```

<!-- You can also unregister a parser using: -->
登録したパーサーは解除できます。

```java
RestAssured.unregisterParser("application/vnd.uoml+xml");
```

<!-- Parsers can also be specified per "request": -->
リクエストごとにパーサーを指定することもできます。

```java
get(..).then().using().parser("application/vnd.uoml+xml", Parser.XML). ..;
```

<!-- and using a [response specification](sSpecification-re-use). -->
[レスポンスの仕様](#specification-re-use) として指定することもできます。

### Default

<!-- Sometimes it's useful to specify a default parser, e.g. if the response doesn't contain a content-type at all: -->
レスポンスに HTTP ヘッダーの content-type が無い場合などのために、既定のパーサーを登録しておくと便利です。

```java
RestAssured.defaultParser = Parser.JSON;
```

<!-- You can also specify a default parser for a single request: -->
リクエストごとに既定のパーサーを指定することもできます。

```java
get("/x").then().using().defaultParser(Parser.JSON). ..
```

<!-- or using a [response specification](#specification-re-use). -->
[レスポンスの仕様](#specification-re-use) として指定することもできます。

## Default values

<!-- By default REST assured assumes host localhost and port 8080 when doing a request. If you want a different port you can do: -->
初期設定の REST Assured はリクエストを localhost の 8080 番ポートに送信します。
リクエストを送信するポート番号を変更したい場合は次のように記述します。

```java
given().port(80). ..
```

<!-- or simply: -->
単純にポート番号を含むURLを指定できます。

```java
..when().get("http://myhost.org:80/doSomething");
```

<!-- You can also change the default base URI, base path, port and authentication scheme for all subsequent requests: -->
全てのリクエストで使用する URI、パス、ポート番号、認証方式を変更できます。

```java
RestAssured.baseURI = "http://myhost.org";
RestAssured.port = 80;
RestAssured.basePath = "/resource";
RestAssured.authentication = basic("username", "password");
RestAssured.rootPath = "x.y.z";
```

<!-- This means that a request like e.g. `get("/hello")` goes to: http://myhost.org:80/resource/hello with basic authentication credentials "username" and "password". See [rootPath](http://code.google.com/p/rest-assured/wiki/Usage#Root_path) for more info about setting the root paths. Other default values you can specify are: -->
この場合、`get("/hello")` というコードは、"username" と "password" を資格情報とするベーシック認証で `http://myhost.org:80/resource/hello` に GET リクエストを送信します。
`rootPath` について詳しくは [ルートパス](#root-path) を参照してください。

他にもいろいろな初期値を変更できます。

```java
RestAssured.filters(..); // フィルターのリスト
RestAssured.requestSpecification = .. // リクエストの仕様
RestAssured.responseSpecification = .. // レスポンスの仕様
RestAssured.urlEncodingEnabled = .. // リクエストパラメータの URL エンコードの有効化
RestAssured.defaultParser = .. // 未対応の content-type に対するレスポンス本文のパーサー
RestAssured.registerParser(..) // content-type に対応するパーサー
RestAssured.unregisterParser(..) // content-type から除外するパーサー
```

<!-- You can reset to the standard baseURI (localhost), basePath (empty), standard port (8080), standard root path (""), default authentication scheme (none) and url encoding enabled (true) using: -->

`reset` メソッドは、それぞれの設定値を初期値に戻します（baseURI（localhost）、basePath（なし）、ポート番号（8080）、ルートパス（なし）、認証方式（なし）、URL エンコーディング（有効））。

```java
RestAssured.reset();
```

## Specification Re-use

<!-- Instead of having to duplicate response expectations and/or request parameters for different tests you can re-use an entire specification. To do this you define a specification using either the [RequestSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/RequestSpecBuilder.html) or [ResponseSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseSpecBuilder.html). -->
いくつものテストで同じレスポンスの期待値やリクエストパラメータを重複させる代わりに、仕様として再利用できます。
リクエストの仕様は [RequestSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/RequestSpecBuilder.html) で、レスポンスの仕様は [ResponseSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseSpecBuilder.html) で定義できます。

<!-- E.g. let's say you want to make sure that the expected status code is 200 and that the size of the JSON array "x.y" has size 2 in several tests you can define a ResponseSpecBuilder like this: -->
ステータスコードの期待値が 200、レスポンス本文の期待値が JSON 配列 `x.y` の要素数が2であることとするレスポンスの仕様は、次のように記述します。

```java
ResponseSpecBuilder builder = new ResponseSpecBuilder();
builder.expectStatusCode(200);
builder.expectBody("x.y.size()", is(2));
ResponseSpecification responseSpec = builder.build();

// "responseSpec" は他のテストでも再利用できます
when()
   .get("/something")
.then()
   .spec(responseSpec)
   .body("x.y.z", equalTo("something"));
```

<!-- In this example the data defined in "responseSpec" is merged with the additional body expectation and all expectations must be fulfilled in order for the test to pass. -->
この例では、"responseSpec" として定義したレスポンス本文に関する期待値に、このテスト特有の期待値をマージすることになります。
全ての期待値を満たさなければテストは成功しません。

<!-- You can do the same thing if you need to re-use request data in different tests. E.g. -->
複数のテストで再利用するべきリクエストデータも同じように定義できます。

```java
RequestSpecBuilder builder = new RequestSpecBuilder();
builder.addParam("parameter1", "parameterValue");
builder.addHeader("header1", "headerValue");
RequestSpecification requestSpec = builder.build();
  
given()
    .spec(requestSpec)
    .param("parameter2", "paramValue")
.when()
    .get("/something")
.then()
    .body("x.y.z", equalTo("something"));
```

<!-- Here the request's data is merged with the data in the "requestSpec" so the request will contain two parameters ("parameter1" and "parameter2") and one header ("header1"). -->
この例でも "requestSpec" として定義した内容に、このテスト特有の内容をマージすることになります。
従って、このテストでは1つの HTTP ヘッダー "header1" と2つのリクエストパラメータ "parameter1" ”parameter2" を含むリクエストを送信することになります。

### Querying RequestSpecification

<!-- Sometimes it's useful to be able to query/extract values form a RequestSpecification. For this reason you can use the `io.restassured.specification.SpecificationQuerier`. For example: -->
 `RequestSpecification` に定義した値を参照したり抽出したりできると役に立つ場合があります。
 そういう場合は `io.restassured.specification.SpecificationQuerier` を使用します。

```java
RequestSpecification spec = ...
QueryableRequestSpecification queryable = SpecificationQuerier.query(spec);
String headerValue = queryable.getHeaders().getValue("header");
String param = queryable.getFormParams().get("someparam");
```

## Filters

<!-- A filter allows you to inspect and alter a request before it's actually committed and also inspect and [alter](#response-builder) the response before it's returned to the expectations. You can regard it as an "around advice" in AOP terms. Filters can be used to implement custom authentication schemes, session management, logging etc. To create a filter you need to implement the [io.restassured.filter.Filter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/Filter.html) interface. To use a filter you can do: -->
フィルターを使うと、コミットする前のリクエストや、期待値と突き合わせて評価する前のリクエストを検証したり、変更したりできるようになります。
AOP（アスペクト指向プログラミング）における "around advice" のように考えることができます。
フィルターは、独自の認証方式やセッション管理、ログ出力を実現するためにも使用できます。
独自のフィルターを作成するときは [io.restassured.filter.Filter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/Filter.html) を実装します。

```java
given().filter(new MyFilter()). ..
```

<!-- There are a couple of filters provided by REST Assured that are ready to use: -->
REST Assured では次のようなフィルターを利用できるようになっています。

1. `io.restassured.filter.log.RequestLoggingFilter`: リクエストの仕様について、詳細な内容を出力します
1. `io.restassured.filter.log.ResponseLoggingFilter`: 指定されたステータスコードの一致するレスポンスについて、詳細な内容を出力します。
1. `io.restassured.filter.log.ErrorLoggingFilter`: エラーレスポンスを受信した場合（ステータスコードが 400 以上 500 未満の場合）、レスポンスの詳細な内容を出力します

#### Ordered Filters

<!-- As of REST Assured 3.0.2 you can implement the [io.restassured.filter.OrderedFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/OrderedFilter.html) interface if you need to control the filter ordering. Here you implement the `getOrder` method to return an integer representing the precedence of the filter. A lower value gives higher precedence. The highest precedence you can define is `Integer.MIN_VALUE` and the lowest precedence is `Integer.MAX_VALUE`. Filters not implementing [io.restassured.filter.OrderedFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/OrderedFilter.html) will have a default precedence of `1000`. Click [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/OrderedFilterITest.java) for some examples. -->
REST Assured 3.0.2 から、 [io.restassured.filter.OrderedFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/OrderedFilter.html) を実装することで、フィルターの適用順序を制御できるようになりました。
`getOrder` メソッドの返す数値がフィルターの優先順位になります。
小さいほど優先順位が高くなります。
つまり、`Integer.MIN_VALUE` の優先順位は最高、`Inteer.MAX_VALUE` の優先順位は最低です。
`OrderedFilter` を実装していないフィルターの優先順位は `getOrder` メソッドが `1000` を返す場合と同じになります。

`OrderedFilter` の使い方を知りたければ [サンプルコード](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/OrderedFilterITest.java) を参照してください。

#### Response Builder

<!-- If you need to change the [Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) from a filter you can use the [ResponseBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseBuilder.html) to create a new Response based on the original response. For example if you want to change the body of the original response to something else you can do: -->
フィルターで [レスポンスオブジェクト](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) を変更するときは、[ResponseBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseBuilder.html) で元のレスポンスオブジェクトから新しいオブジェクトを作成しなければなりません。
例えば、レスポンス本文を "something" に変更したいときは次のように記述します。

```java
Response newResponse = new ResponseBuilder().clone(originalResponse).setBody("Something").build();
```

## Logging

<!-- In many cases it can be useful to print the response and/or request details in order to help you create the correct expectations and send the correct requests. To do help you do this you can use one of the predefined [filters](#filters) supplied with REST Assured or you can use one of the shortcuts. -->
リクエストやレスポンスの詳細な内容を出力することが、正しい期待値や正しいリクエストを作成するのに役立つ場合があります。
そういう場合は REST Assured に組み込みのフィルターを使えば簡単です。

### Request Logging

<!-- Since version 1.5 REST Assured supports logging the _[request specification](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/RequestSpecification.html)_ before it's sent to the server using the [RequestLoggingFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/log/RequestLoggingFilter.html). Note that the HTTP Builder and HTTP Client may add additional headers then what's printed in the log. The filter will _only_ log details specified in the request specification. I.e. you can NOT regard the details logged by the [RequestLoggingFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/log/RequestLoggingFilter.html) to be what's actually sent to the server. Also subsequent filters may alter the request _after_ the logging has taken place. If you need to log what's _actually_ sent on the wire refer to the [HTTP Client logging docs](http://hc.apache.org/httpcomponents-client-ga/logging.html) or use an external tool such [Wireshark](http://www.wireshark.org/). Examples: -->
REST Assured 1.5 から、[RequestLoggingFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/log/RequestLoggingFilter.html) で実際にサーバーへ送信する前にリクエストの仕様をログに出力できるようになりました。
HTTP Builder や HTTP Client の追加した HTTP ヘッダーも出力するので注意してください。
ただし、このフィルターは基本的にリクエストの仕様に定義した内容 _だけ_ を出力するようになっています。
実際にサーバーへ送信するリクエストの内容そのものではないということです。
また、`RequestLoggingFilter` より優先度の低いフィルターが変更した内容は出力できません。

サーバーに送信したリクエストと _完全に同じ内容_ をログに出力したいときは、[HTTP Client のログ出力](http://hc.apache.org/httpcomponents-client-ga/logging.html) を検討するか、[Wireshark](http://www.wireshark.org/) などのツール利用を検討してください。

```java
given().log().all(). .. // リクエストの仕様に定義したリクエストパラメータ、HTTP ヘッダー、リクエスト本文等、全てをログに出力します。
given().log().params(). .. // リクエストパラメータだけをログに出力します。
given().log().body(). .. // リクエスト本文だけをログに出力します。
given().log().headers(). .. // HTTP ヘッダーだけをログに出力します。
given().log().cookies(). .. // HTTP Cookie だけをログに出力します。
given().log().method(). .. // リクエストメソッドだけをログに出力します。
given().log().path(). .. // パスだけをログに出力します。
```

### Response Logging

<!-- If you want to print the response body regardless of the status code you can do: -->
ステータスコードの値を無視してレスポンス本文をログに出力させたいときは次のように記述します。

```java
get("/x").then().log().body() ..
```

<!-- This will print the response body regardless if an error occurred. If you're only interested in printing the response body if an error occur then you can use: -->
このコード例では、たとえエラーレスポンスでもレスポンス本文をログに出力します。
エラーレスポンスの場合だけログに出力したい場合は次のように記述します。

```java
get("/x").then().log().ifError(). .. 
```

<!-- You can also log all details in the response including status line, headers and cookies: -->
ステータスラインや HTTP ヘッダー、HTTP Cookie など全ての詳細な内容をログに出力したいときは次のように記述します。

```java
get("/x").then().log().all(). .. 
```

<!-- as well as only status line, headers or cookies: -->
ステータスラインだけ、HTTP ヘッダーだけ、HTTP Cookie だけをログに出力したいときは次のように記述します。

```java
get("/x").then().log().statusLine(). .. // ステータスラインだけをログに出力します。
get("/x").then().log().headers(). .. // HTTP ヘッダーだけをログに出力します。
get("/x").then().log().cookies(). .. // HTTP Cookie だけをログに出力します。
```

<!-- You can also configure to log the response only if the status code matches some value: -->
ステータスコードが指定した値に一致する、あるいは指定した条件と一致する場合だけログを出力したいときは次のように記述します。

```java
get("/x").then().log().ifStatusCodeIsEqualTo(302). .. // ステータスコードが 302 のときだけログに出力します。
get("/x").then().log().ifStatusCodeMatches(matcher). .. // ステータスコードが Hamcrest マッチャーで真になったときだけログに出力します。
```

### Log if validation fails

<!-- Since REST Assured 2.3.1 you can log the request or response only if the validation fails. To log the request do: -->
REST Assured 2.3.1 から、バリデーションに失敗した場合だけリクエストやレスポンスをログに出力できるようになりました。

リクエストをログに出力するときは次のように記述します。

```java
given().log().ifValidationFails(). ..
```

<!-- To log the response do: -->
レスポンスをログに出力するときは次のように記述します。

```java
.. .then().log().ifValidationFails(). ..
```

<!-- It's also possible to enable this for both the request and the response at the same time using the [LogConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html): -->
リクエストとレスポンスのログ出力を同じように制御するには、[LogConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html) を設定します。

```java
given().config(RestAssured.config().logConfig(logConfig().enableLoggingOfRequestAndResponseIfValidationFails(HEADERS))). ..
```

<!-- This will log only the headers if validation fails. -->
このコード例では、バリデーションが失敗したとき、HTTP ヘッダーだけをログに出力します。

<!-- There's also a shortcut for enabling logging of the request and response for all requests if validation fails: -->
全てのテストについて、バリデーションが失敗したときリクエストとレスポンスをログに出力させるには、次のように記述します。

```java
RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
```

### Blacklist Headers from Logging

<!-- As of REST Assured 4.2.0 it's possible to blacklist headers so that they are not shown in the request or response log. Instead the header value will be replaced with `[ BLACKLISTED ]`. You can enable this per header basis using the [LogConfig](https://www.javadoc.io/doc/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html): -->
REST Assured 4.2.0 から、リクエストやレスポンスをログに出力するとき、ログに出力させない HTTP ヘッダーの不許可リストを設定できるようになりました。
HTTP ヘッダーの値には、実際の値の代わりに `[ BLACKLISTED ]` を出力するようになります。
[LogConfig](https://www.javadoc.io/doc/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html) で設定できます。

```java
given().config(config().logConfig(logConfig().blacklistHeader("Accept"))). ..
```

<!-- The response log will the print: -->
この場合、レスポンスは次のようにログへ出力されます。

    Request method:   GET
    Request URI:    http://localhost:8080/something
    Proxy:          <none>
    Request params: <none>
    Query params:   <none>
    Form params:    <none>
    Path params:    <none>
    Headers:        Accept=[ BLACKLISTED ]
    Cookies:        <none>
    Multiparts:     <none>
    Body:           <none>

## Root path

<!-- To avoid duplicated paths in body expectations you can specify a root path. E.g. instead of writing: -->
ルートパスを指定して、レスポンス本文の期待値に記述するパスの重複を減らすことができます。

ルートパスを指定しない場合は次のように記述します。

```java
when()
     .get("/something")
.then()
     .body("x.y.firstName", is(..))
     .body("x.y.lastName", is(..))
     .body("x.y.age", is(..))
     .body("x.y.gender", is(..));
```

<!-- you can use a root path and do: -->
ルートパスを指定すると次のように記述できます。

```java
when()
    .get("/something")
.then()
     .root("x.y"). // "root" メソッドで指定します
     .body("firstName", is(..))
     .body("lastName", is(..))
     .body("age", is(..))
     .body("gender", is(..));
```

<!-- You can also set a default root path using: -->
既定のルートパスを設定することもできます。

```java
RestAssured.rootPath = "x.y";
```

<!-- In more advanced use cases it may also be useful to append additional root arguments to existing root arguments. To do this you can use the `appendRoot` method, for example: -->
既定のルートパスを延長できると、複雑なユースケースで役立つ場合があります。
ルートパスは `appendRoot` メソッドで追加できます。

```java
when()
     .get("/jsonStore")
.then()
     .root("store.%s", withArgs("book"))
     .body("category.size()", equalTo(4))
     .appendRoot("%s.%s", withArgs("author", "size()"))
     .body(withNoArgs(), equalTo(4));
```

<!-- It's also possible to detach a root. For example: -->
途中でルートパスを縮小することもできます。

```java
when()
     .get("/jsonStore")
.then()
     .root("store.category")
     .body("size()", equalTo(4))
     .detachRoot("category")
     .body("size()", equalTo(1));
```

## Path arguments

<!-- Path arguments are useful in situations where you have e.g. pre-defined variables that constitutes the path. For example -->
定義済みの変数を組み合わせてパスを構成しているときは、パス引数形式にしたほうが便利な場合があります。

```java
String someSubPath = "else";
int index = 1;
get("/x").then().body("something.%s[%d]", withArgs(someSubPath, index), equalTo("some value")). ..
```

<!-- will expect that the body path "`something.else[0]`" is equal to "some value". -->
このコード例では、レスポンス本文の `something.else[0]` が "some value" と一致することを検証できます。

<!-- Another usage is if you have complex [root paths](http://code.google.com/p/rest-assured/wiki/Usage#Root_path) and don't wish to duplicate the path for small variations: -->
一部だけ異なる複雑な [ルートパス](#root-path) の重複した記述を減らすために使うこともできます。

```java
when()
   .get("/x")
.then()
   .root("filters.filterConfig[%d].filterConfigGroups.find { it.name == 'GroupName' }.includes")
   .body(withArgs(0), hasItem("first"))
   .body(withArgs(1), hasItem("second")).
       ..
```

<!-- The path arguments follows the standard [formatting syntax](http://download.oracle.com/javase/1,5.0/docs/api/java/util/Formatter.html#syntax) of Java. -->
パス引数の記法は Java の [書式付き出力](https://docs.oracle.com/javase/jp/8/docs/api/java/util/Formatter.html) と同じです。

<!-- Note that the `withArgs` method can be statically imported from the [io.restassured.RestAssured](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/RestAssured.html) class. -->
`withArgs` メソッドを使うには [io.restassured.RestAssured](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/RestAssured.html) クラスの static imoprt が必要です。

<!-- Sometimes it's also useful to validate a body without any additional arguments when all arguments have already been specified in the root path. This is where `withNoArgs` come into play. For example: -->
ルートパスに記述された全ての引数がそろっているなら、引数無しでレスポンス本文を検証できるようにしたほうが便利でしょう。
そういうときは `withNoArgs` メソッドを使います。

```java
when()
     .get("/jsonStore")
.then()
     .root("store.%s", withArgs("book"))
     .body("category.size()", equalTo(4))
     .appendRoot("%s.%s", withArgs("author", "size()"))
     .body(withNoArgs(), equalTo(4));
```

## Session support

<!-- REST Assured provides a simplified way for managing sessions. You can define a session id value in the DSL: -->
REST Assured は単純なセッション管理機能を提供しています。
セッションIDを指定するDSLは次のように記述します。

```java
given().sessionId("1234"). .. 
```

<!-- This is actually just a short-cut for: -->
次のように記述した場合と同じことをしています。

```java
given().cookie("JSESSIONID", "1234"). .. 
```

<!-- You can also specify a default `sessionId` that'll be supplied with all subsequent requests: -->
全てのリクエストに指定するセッションIDの初期値をクラスメンバ変数に設定できます。

```java
RestAssured.sessionId = "1234";
```

<!-- By default the session id name is `JSESSIONID` but you can change it using the [SessionConfig](#session-config): -->
初期設定では HTTP Cookie の `JSESSIONID` からセッションIDを取得します。
取得元は [SessionConfig](#session-config) で変更できます。

```java
RestAssured.config = RestAssured.config().sessionConfig(new SessionConfig().sessionIdName("phpsessionid"));
```

<!-- You can also specify a sessionId using the `RequestSpecBuilder` and reuse it in many tests: -->
`RequestSpecBuilder` でセッションIDを定義して、他のテストで再利用することもできます。

```java
RequestSpecBuilder spec = new RequestSpecBuilder().setSessionId("value1").build();
   
// 最初のリクエストで送信するセッションIDは "value1"
given().spec(spec). .. 
// 二回目のリクエストで送信するセッションIDも "value1"
given().spec(spec). .. 
```

<!-- It's also possible to get the session id from the response object: -->
もちろん、レスポンスオブジェクトからセッションIDを取得できます。

```java
String sessionId = get("/something").sessionId();
```

### Session Filter

<!-- As of version 2.0.0 you can use a [session filter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/session/SessionFilter.html) to automatically capture and apply the session, for example: -->
REST Assured 2.0.0 から、[SessionFilter](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/filter/session/SessionFilter.html) でセッションIDの取得と送信を自動化できるようになりました。

```java
SessionFilter sessionFilter = new SessionFilter();

given()
    .auth().form("John", "Doe")
    .filter(sessionFilter)
.when()
    .get("/formAuth")
.then()
    .statusCode(200);


given()
    .filter(sessionFilter) // 直前のレスポンスから取得したセッションIDを再利用する
.when()
    .get("/x")
.then()
    .statusCode(200);
```

<!-- To get session id caught by the `SessionFilter` you can do like this: -->
`SessionFilter` の取得したセッションIDは次のように参照できます。

```java
String sessionId = sessionFilter.getSessionId();
```

## SSL

<!-- In most situations SSL should just work out of the box thanks to the excellent work of HTTP Builder and HTTP Client. There are however some cases where you'll run into trouble. You may for example run into a SSLPeerUnverifiedException if the server is using an invalid certificate. The easiest way to workaround this is to use "relaxed HTTPs validation". For example: -->
HTTP Builder や HTTP Client の提供する素晴らしい機能のおかげで、ほとんどの場合何もしなくても SSL を利用できるようになっています。
それでも、通信に失敗する場合はあります。
サーバーが不正な証明書を使っている場合は `SSLPeerUnverifiedException` が発生します。
簡単な回避策は `relaxedHTTPSValidation` で HTTPS のバリデーションを緩和することです。

```java
given().relaxedHTTPSValidation().when().get("https://some_server.com"). .. 
```

<!-- You can also define this statically for all requests: -->
全てのリクエストについて設定することもできます。

```java
RestAssured.useRelaxedHTTPSValidation();
```

<!-- or in a [request specification](#specification-re-use). -->
[リクエストの仕様](#specification-re-use) で設定することもできます。

<!-- This will assume an SSLContext protocol of  `SSL`. To change to another protocol use an overloaded versionen of  `relaxedHTTPSValidation`. For example: -->
次のコード例では `SSLContext` のプロトコルとして `SSL` を使用しています。
`relaxedHTTPSValidation` のオーバーロードメソッドでは別のプロトコルを指定できるのです。

```java
given().relaxedHTTPSValidation("TLS").when().get("https://some_server.com"). .. 
```

<!-- You can also be more fine-grained and create Java keystore file and use it with REST Assured. It's not too difficult, first follow the guide [here](https://github.com/jgritman/httpbuilder/wiki/SSL) and then use the keystore in Rest Assured like this: -->
自分で作成した Java キーストアファイルを使用するより詳細な設定もできるようになっています。
それほど難しいことではありませんが、[HTTP Builder の SSL に関する説明](https://github.com/jgritman/httpbuilder/wiki/SSL) を読んでおくといいでしょう。

```java
given().keystore("/pathToJksInClassPath", <password>). .. 
```

<!-- or you can specify it for every request: -->
全てのリクエストについて設定することもできます。

```java
RestAssured.keystore("/pathToJksInClassPath", <password>);
```

<!-- You can also define a keystore in a re-usable [specification](http://code.google.com/p/rest-assured/wiki/Usage#Specification_Re-use). -->
[リクエストの仕様](#specification-re-use) で設定することもできます。

<!-- If you already loaded a keystore with a password you can use it as a truststore: -->
パスワード付きのキーストアを読み込んでからトラストストアへ設定することもできます。

```java
RestAssured.trustStore(keystore);
```

<!-- You can find a working example [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/SSLTest.java). -->
使い方は [サンプルコード](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/SSLITest.java) を参照してください。

<!-- For more advanced SSL Configuration refer to the [SSL Configuration](#ssl-config) section. -->
より高度な SSL の設定をするときは [SSL の設定](#ssl-config) を参照してください。

### SSL invalid hostname

<!-- If the certificate is specifying an invalid hostname you don't need to create and import a keystore. As of version `2.2.0` you can do: -->
REST Assured 2.2.0 から、サーバー証明書のホスト名とアクセスするホスト名が一致しない場合でも、Java キーストアファイルを作成、インポートしなくてもよくなりました。

全てのリクエストについて設定するときは次のように記述します。

```java
RestAssured.config = RestAssured.config().sslConfig(sslConfig().allowAllHostnames());
```

<!-- to allow all hostnames for all requests or: -->
単独のリクエストについて設定するときは次のように記述します。

```java
given().config(RestAssured.config().sslConfig(sslConfig().allowAllHostnames())). .. ;
```

<!-- for a single request. -->

<!-- Note that if you use "relaxed HTTPs validation" then `allowAllHostnames` is activated by default. -->
`relaxedHTTPSValidation` を有効化した場合、`allowAllHostnames` も有効になっているので注意してください。

## URL Encoding

<!-- Usually you don't have to think about URL encoding since Rest Assured provides this automatically out of the box. In some cases though it may be useful to turn URL Encoding off. One reason may be that you already the have some parameters encoded before you supply them to Rest Assured. To prevent double URL encoding you need to tell Rest Assured to disable it's URL encoding. E.g. -->
REST Assured は自動的に URL エンコード処理をするので、基本的には考慮する必要がありません。
URL エンコード処理を無効にするときはそのための設定が必要です。
具体的には、URL エンコードされている値を REST Assured のパラメータとして渡す場合があるでしょう。
URL エンコードを二重に適用しないよう、REST Assured の URL エンコード処理を無効にしなければならないのです。

```java
String response = given()
    .urlEncodingEnabled(false)
    .get("https://jira.atlassian.com:443/rest/api/2.0.alpha1/search?jql=project%20=%20BAM%20AND%20issuetype%20=%20Bug")
    .asString();
..
```

<!-- or -->
全てのリクエストについて設定するときは次のように記述します。

```java
RestAssured.baseURI = "https://jira.atlassian.com";
RestAssured.port = 443;
RestAssured.urlEncodingEnabled = false;
final String query = "project%20=%20BAM%20AND%20issuetype%20=%20Bug";
String response = get("/rest/api/2.0.alpha1/search?jql={q}", query);
..
```

## Proxy Configuration

<!-- Starting from version 2.3.2 REST Assured has better support for proxies. For example if you have a proxy at localhost port 8888 you can do: -->
REST Assured 2.3.2 ではプロキシ対応機能を改善しました。

localhost の 8888 番ポートを指定するときは次のように記述します。

```java
given().proxy("localhost", 8888). .. 
```

<!-- Actually you don't even have to specify the hostname if the server is running on your local environment: -->
プロキシホストが localhost の場合はポート番号を指定するだけでも動作します。

```java
given().proxy(8888). .. // Will assume localhost
```

<!-- To use HTTPS you need to supply a third parameter (scheme) or use the `io.restassured.specification.ProxySpecification`. For example: -->
HTTPS でアクセスする必要があるときは、3番目の引数にプロトコルスキーマを指定するか、`io.restassured.specification.ProxySpecification` を使用します。

```java
given().proxy(host("localhost").withScheme("https")). ..
```

<!-- where `host` is statically imported from `io.restassured.specification.ProxySpecification`. -->
`host` メソッドは `io.restassured.specification.ProxySpecification` のクラスメソッドです。

<!-- Starting from version 2.7.0 you can also specify preemptive basic authentication for proxies. For example: -->
REST Assured 2.7.0 から、プリエンプティブベーシック認証でプロキシに接続できるようになりました。

```java
given().proxy(auth("username", "password")).when() ..
```

<!-- where `auth` is statically imported from [io.restassured.specification.ProxySpecification](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/ProxySpecification.html). You can of course also combine authentication with a different host: -->
`auth` メソッドは [io.restassured.specification.ProxySpecification](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/ProxySpecification.html) のクラスメソッドです。

`host` メソッドで別のホスト名を指定できます。

```java
given().proxy(host("http://myhost.org").withAuth("username", "password")). ..
```

### Static Proxy Configuration

<!-- It's also possible to configure a proxy statically for all requests, for example: -->
全てのリクエストについて設定するときは次のように記述します。

```java
RestAssured.proxy("localhost", 8888);    
```

<!-- or: -->
次のように記述することもできます。

```java
RestAssured.proxy = host("localhost").withPort(8888);
```

### Request Specification Proxy Configuration

<!-- You can also create a request specification and specify the proxy there: -->
リクエストの仕様へプロキシ接続を設定することもできます。

```java
RequestSpecification specification = new RequestSpecBuilder().setProxy("localhost").build();
given().spec(specification). ..
```

## Detailed configuration

<!-- Detailed configuration is provided by the [RestAssuredConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/RestAssuredConfig.html) instance with which you can configure the parameters of [HTTP Client](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/HttpClientConfig.html) as well as [Redirect](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/RedirectConfig.html), [Log](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html), [Encoder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/EncoderConfig.html), [Decoder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/DecoderConfig.html), [Session](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/SessionConfig.html), [ObjectMapper](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ObjectMapperConfig.html), [Connection](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ConnectionConfig.html), [SSL](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/SSLConfig.html) and [ParamConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ParamConfig.html) settings. Examples: -->
[RestAssuredConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/RestAssuredConfig.html) で次のような内容を設定できます。

* HTTP Client - [HTTPClientConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/HttpClientConfig.html) および [RedirectConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/RedirectConfig.html)
* Log - [LogConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html)
* Encoder - [EncoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/EncoderConfig.html)
* Decoder - [DecoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/DecoderConfig.html)
* Session - [SessionConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/SessionConfig.html)
* ObjectMapper - [ObjectMapperConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ObjectMapperConfig.html)
* Connection- [ConnectionConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ConnectionConfig.html)
* SSL- [SSLConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/SSLConfig.html)
* Parameter- [ParamConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ParamConfig.html)

<!-- For a specific request: -->
単独のリクエストには次のように設定します。

```java
given().config(RestAssured.config().redirect(redirectConfig().followRedirects(false))). ..
```

<!-- or using a RequestSpecBuilder: -->
`RequestSpecBuilder` には次のように設定します。

```java
RequestSpecification spec = new RequestSpecBuilder().setConfig(
    RestAssured.config().redirect(
        redirectConfig().followRedirects(false)))
.build();
```

<!-- or for all requests: -->
全てのリクエストを対象とするには次のように設定します。

```java
RestAssured.config = config().redirect(
    redirectConfig().followRedirects(true).and().maxRedirects(0));
```

<!-- `config()` and `newConfig()` can be statically imported from `io.restassured.config.RestAssuredConfig`. -->
`config` メソッドや `newConfig` メソッドは `io.restassured.config.RestAssuredConfig` のクラスメソッドです。

### Encoder Config

<!-- With the [EncoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/EncoderConfig.html) you can specify the default content encoding charset (if it's not specified in the content-type header) and query parameter charset for all requests. If no content charset is specified then ISO-8859-1 is used and if no query parameter charset is specified then UTF-8 is used. Usage example: -->
[EncoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/EncoderConfig.html) では、コンテンツとクエリパラメータで使用する文字エンコーディングと文字セットを指定できます（指定しなかった場合は HTTP ヘッダー content-type の値に従います）。
コンテンツの文字セットを指定しなかった場合、`ISO-8859-1` になります。
クエリパラメータの文字セットを指定しなかった場合、`UTF-8` になります。

```java
RestAssured.config = RestAssured.config().encoderConfig(
    encoderConfig().defaultContentCharset("US-ASCII"));
```

<!-- You can also specify which encoder charset to use for a specific content-type if no charset is defined explicitly for this content-type by using the `defaultCharsetForContentType` method in the [EncoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/EncoderConfig.html). For example: -->
`EncoderConfig` の `defaultCharsetForContentType` メソッドを使うと、content-type に文字セットが指定されていなかった場合に使用する文字セットのエンコーダを、content-type ごとに定義できます。

```java
RestAssured.config = RestAssured.config(
    config().encoderConfig(
        encoderConfig().defaultCharsetForContentType("UTF-16", "application/xml")));
```

<!-- This will assume UTF-16 encoding for "application/xml" content-types that does explicitly specify a charset. By default "application/json" is specified to use "UTF-8" as default content-type as this is specified by [RFC4627](https://www.ietf.org/rfc/rfc4627.txt). -->
このコード例では、content-type の "application/xml" へ文字セットが明示的に指定されなかった場合、`UTF-16` として扱います。
なお、"application/json" の既定の文字セットは [RFC4627](https://www.ietf.org/rfc/rfc4627.txt) で定義されており、`UTF-8` として扱います。

#### Avoid adding the charset to content-type header automatically

<!-- By default REST Assured adds the charset header automatically. To disable this completely you can configure the `EncoderConfig` like this: -->
REST Assured は自動的に文字セットのための HTTP ヘッダーを自動的に追加します。
この振る舞いを無効化するには `EditorConfig` で設定します。

```java
RestAssured.config = RestAssured.config(
    config().encoderConfig(
        encoderConfig().appendDefaultContentCharsetToContentTypeIfUndefined(false)));
```

### Decoder Config

<!-- With the [DecoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/DecoderConfig.html) you can set the default response content decoding charset for all responses. This is useful if you expect a different content charset than ISO-8859-1 (which is the default charset) and the response doesn't define the charset in the content-type header. Usage example: -->
[DecoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/DecoderConfig.html) では全てのレスポンスについて、コンテンツをデコードするときの既定の文字セットを設定できます。
既定の文字セットである `ISO-8859-1` 以外の文字セットを想定している場合や、レスポンスの content-type で文字セットが指定されていなかった場合に役立ちます。

```java
RestAssured.config = RestAssured.config().decoderConfig(
    decoderConfig().defaultContentCharset("UTF-8"));
```

<!-- You can also use the `DecoderConfig` to specify which content decoders to apply. When you do this the `Accept-Encoding` header will be added automatically to the request and the response body will be decoded automatically. By default GZIP and DEFLATE decoders are enabled. To for example to remove GZIP decoding but retain DEFLATE decoding you can do the following: -->
特定のデコーダを指定することもできます。
この設定をすると、リクエストの HTTP ヘッダーに `Accept-Encoding` を自動的に追加し、レスポンス本文も自動的にデコードします。
組み込みのデコーダとして `GZIP` と `DEFLATE` が利用できるようになっています。

`GZIP` の代わりに `DEFLATE` を使用する場合は次のように記述します。

```java
given().config(RestAssured.config().decoderConfig(
    decoderConfig().contentDecoders(DEFLATE))). ..
```

<!-- You can also specify which decoder charset to use for a specific content-type if no charset is defined explicitly for this content-type by using the "defaultCharsetForContentType" method in the [DecoderConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/DecoderConfig.html). For example: -->
`DecoderConfig` の `defaultCharsetForContentType` メソッドを使うと、content-type に文字セットが指定されていなかった場合に使用する文字セットのデコーダーを、content-type ごとに定義できます。
  

```java
RestAssured.config = RestAssured.config(
    config().decoderConfig(
        decoderConfig().defaultCharsetForContentType("UTF-16", "application/xml")));
```

<!-- This will assume UTF-16 encoding for "application/xml" content-types that does explicitly specify a charset. By default "application/json" is using "UTF-8" as default charset as this is specified by [RFC4627](https://www.ietf.org/rfc/rfc4627.txt). -->
このコード例では、content-type の "application/xml" へ文字セットが明示的に指定されなかった場合、`UTF-16` として扱います。
なお、"application/json" の既定の文字セットは [RFC4627](https://www.ietf.org/rfc/rfc4627.txt) で定義されており、`UTF-8` として扱います。

### Session Config

<!-- With the session config you can configure the default session id name that's used by REST Assured. The default session id name is `JSESSIONID` and you only need to change it if the name in your application is different and you want to make use of REST Assured's [session support](#Session_support). Usage: -->
`SessionConfig` はセッションIDの受け渡しに使う既定のパラメータ名を設定できます。
初期値は `JSESSIONID` です。
違う名前を使用するアプリケーションで [セッション管理機能](#session-support) を使いたい場合は設定しなければなりません。

```java
RestAssured.config = RestAssured.config().sessionConfig(
    new SessionConfig().sessionIdName("phpsessionid"));
```

### Redirect DSL

<!-- Redirect configuration can also be specified using the DSL. E.g. -->
リダイレクトの振る舞いは DSL で設定できます。

```java
given().redirects().max(12).and().redirects().follow(true).when(). .. 
```

### Connection Config

<!-- Lets you configure connection settings for REST Assured. For example if you want to force-close the Apache HTTP Client connection after each response. You may want to do this if you make a lot of fast consecutive requests with small amount of data in the response. However if you're downloading (especially large amounts of) chunked data you must not close connections after each response. By default connections are _not_ closed after each response. -->
REST Assured は HTTP 接続のための設定を変更できます。
例えば、Apache HTTP Client でレスポンスを受信するたびに強制的に HTTP 接続を閉じるようにできます。
小さいレスポンスを返すリクエストを、大量に、高速に、連続して送信したい場合などが該当します。
もちろん、いくつかの塊として（巨大な）データを受信しているときは、レスポンスを受信してすぐに HTTP 接続を閉じてはいけません。
初期設定ではレスポンスを受信するたびに _HTTP 接続を閉じない_ ようになっています。

```java
RestAssured.config = RestAssured.config().connectionConfig(c
    onnectionConfig().closeIdleConnectionsAfterEachResponse());
```

### Json Config

<!-- [JsonPathConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/path/json/config/JsonPathConfig.html) allows you to configure the Json settings either when used by REST Assured or by [JsonPath](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/path/json/JsonPath.html). It let's you configure how JSON numbers should be treated. -->
[JsonPathConfig](https://javadoc.io/doc/io.rest-assured/json-path/latest/io/restassured/path/json/config/JsonPathConfig.html) は REST Assured だけでなく、[JsonPath](https://javadoc.io/doc/io.rest-assured/json-path/latest/io/restassured/path/json/JsonPath.html) を単独で使用する場合の設定を変更できます。

次のコード例では JSON number の扱いを変更しています。

```java
RestAssured.config = RestAssured.config().jsonConfig(
    jsonConfig().numberReturnType(NumberReturnType.BIG_DECIMAL))
```

### HTTP Client Config

<!-- Let's you configure properties for the HTTP Client instance that REST Assured will be using when executing requests. By default REST Assured creates a new instance of http client for each "given" statement. To configure reuse do the following: -->
REST Assured が HTTP リクエストを送信するために使用している HTTP Client インスタンスの設定を変更できます。
初期設定では `given` メソッドが毎回新しいインスタンスを作成するようになっています。

作成したインスタンスを再利用できるようにするときは次のように記述します。

```java
RestAssured.config = RestAssured.config().httpClient(
    httpClientConfig().reuseHttpClientInstance());
```

<!-- You can also supply a custom HTTP Client instance by using the `httpClientFactory` method, for example: -->
`httpClientFactory` メソッドで独自の HTTP Client インスタンスを指定することができます。

```java
RestAssured.config = RestAssured.config().httpClient(
    httpClientConfig().httpClientFactory(
         new HttpClientConfig.HttpClientFactory() {

            @Override
            public HttpClient createHttpClient() {
                return new SystemDefaultHttpClient();
            }
        }));
```

<!-- **Note that currently you need to supply an instance of `AbstractHttpClient`.** -->
**注意：今は `AbstractHttpClient` のインスタンスしか指定できません。**

<!-- It's also possible to configure default parameters etc. -->
もちろん、HTTP Client インスタンスの初期値を設定することもできます。

### SSL Config

<!-- The [SSLConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/SSLConfig.html) allows you to specify more advanced SSL configuration such as truststore, keystore type and host name verifier. For example: -->
[SSLConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/SSLConfig.html) は、キーストアの種類やトラストストア、ホスト名検証器等、SSL の細かい設定を変更できます。

```java
RestAssured.config = RestAssured.config().sslConfig(
    sslConfig()
    .with()
        .keystoreType(<type>)
    .and()
        .strictHostnames());
```

### Param Config

<!-- [ParamConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ParamConfig.html) allows you to configure how different parameter types should be updated on "collision". By default all parameters are merged so if you do: -->
[ParamConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/ParamConfig.html) はパラメータの種類ごとに、パラメータ名が衝突した場合の処理を変更できます。
初期設定では全ての値をマージするようになっています。

次のコード例では、REST Assured の送信するクエリ文字列は `param1=value1&param1=value2` になります。

```java
given().queryParam("param1", "value1").queryParam("param1", "value2").when().get("/x"). ...
```

<!-- REST Assured will send a query string of `param1=value1&param1=value2`. This is not always what you want though so you can configure REST Assured to *replace* values instead: -->
後に指定した値で同じ名前のパラメータを *上書き* したい場合は次のように記述します。

```java
given()
    .config(config().paramConfig(paramConfig().queryParamsUpdateStrategy(REPLACE)))
    .queryParam("param1", "value1")
    .queryParam("param1", "value2")
.when()
    .get("/x"). ..
```

<!-- REST Assured will now replace `param1` with `value2` (since it's written last) instead of merging them together. You can also configure the update strategy for each type of for all parameter types instead of doing it per individual basis: -->
この場合、REST Assured は全てのパラメータをマージする代わりに、 `param1` の値を `value2` に上書きします（最後に指定した値です）。

パラメータの種類に応じて個別に設定するのではなく、全てのパラメータ種類で同じ処理をさせたいときは次のように記述します。

```java
given().config(config().paramConfig(
    paramConfig().replaceAllParameters())). ..
```

<!-- This is also supported in the [Spring Mock Mvc Module](#spring-mock-mvc-module) (but the config there is called [MockMvcParamConfig](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/config/MockMvcParamConfig.html)). -->
この機能は [Spring Mock Mvc モジュール](#spring-mock-mvc-module) でも対応しています。
ただし、`ParamConfig` の代わりに [MockMvcParamConfig](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/config/MockMvcParamConfig.html) を使用します。

### Failure Config

<!-- Added in version 3.3.0 the [FailureConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/FailureConfig.html) can be used to get callbacks when REST Assured validation fails. This is useful if you want to do some custom logging or store data available in the request/response specification or in the response itself somewhere. For example let's say that you want to be notified by email when the following test case fails because the status code is not 200: -->
REST Assured 3.3.0 からは、バリデーションが失敗した場合に実行するコールバック処理を [FailureConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/FailureConfig.html) で指定できるようになりました。
リクエストやレスポンス、あるいはそれぞれの仕様に、独自のログ出力やデータ保存処理を追加するのに役立ちます。

例として、次のテストを実行してステータスコードが 200 じゃなかったら電子メールで通知させてみましょう。

```java
given()
    .param("x", "y")
.when()
    .get("/hello")
.then()
    statusCode(200);
```

<!-- You can then implement a [ResponseValidationFailureListener](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/listener/ResponseValidationFailureListener.html) and add it to the [FailureConfig](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/config/FailureConfig.html): -->
[ResponseValidationFailureListener](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/listener/ResponseValidationFailureListener.html) を実装して `FailureConfig` に指定します。

```java
ResponseValidationFailureListener emailOnFailure = (reqSpec, respSpec, resp) -> emailService.sendEmail(
    "email@gmail.com", "Important test failed! Status code was: " + resp.statusCode());

given()
    .config(RestAssured.config().failureConfig(
        failureConfig().with().failureListeners(emailOnFailure)))
    .param("x", "y")
.when()
    .get("/hello")
.then()
    statusCode(200);
```

## Spring Support

<!-- REST Assured contains two support modules for testing Spring Controllers using the REST Assured API: -->
Spring MVC のコントローラを REST Assured の API でテストするため、2種類のモジュールを提供しています。

* [spring-mock-mvc](#spring-mock-mvc-module) - [Spring MVC](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html) のコントローラのユニットテストに使用します。
* [spring-web-test-client](#spring-web-test-client-module) - [Spring Webflux](https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html) のコントローラのユニットテストに使用します。

### Spring Mock Mvc Module

<!-- REST Assured 2.2.0 introduced support for [Spring Mock Mvc](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/web/servlet/MockMvc.html) using the `spring-mock-mvc` module. This means that you can unit test Spring Mvc Controllers. For example given the following Spring controller: -->
REST Assured 2.2.0 から [Spring Mock Mvc](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/web/servlet/MockMvc.html) に対応する `spring-mock-mvc` モジュールが使用できるようになりました。
つまり、Spring MVC のコントローラのユニットテストができるようになったのです。

```java
@Controller
public class GreetingController {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @RequestMapping(value = "/greeting", method = GET)
    public @ResponseBody Greeting greeting(
            @RequestParam(value="name", required=false, defaultValue="World") String name) {
        return new Greeting(counter.incrementAndGet(), String.format(template, name));
    }
}
```

<!-- you can test it using [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html) like this: -->
テストは [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html) で記述します。

```java
given()
    .standaloneSetup(new GreetingController())
    .param("name", "Johan")
.when()
    .get("/greeting")
.then()
    .statusCode(200)
    .body("id", equalTo(1))
    .body("content", equalTo("Hello, Johan!"));
```

<!-- i.e. it's very similar to the standard REST Assured syntax. This makes it really fast to run your tests and it's also easier to bootstrap the environment and use mocks (if needed) than standard REST Assured. Most things that you're used to in standard REST Assured works with RestAssured Mock Mvc as well. For example (certain) configuration, static specifications, logging etc etc. To use it you need to depend on the Spring Mock Mvc module: -->
REST Assured の基本的な記法そのままです。
すごい短い時間でテストを実行できるだけでなく、基本的な REST Assured に比べて、環境の準備や、（必要なら）モックを使用するのが簡単になっています。
基本的な REST Assured の準備に必要なことのほとんど（各種設定や仕様の準備、ロギング等）を `RestAssuredMockMvc` がやってくれるからです。

Maven プロジェクトなら次のような依存ライブラリを追加します。
そうでなければ [jarファイル](https://repo1.maven.org/maven2/io/rest-assured/spring-mock-mvc/latest/spring-mock-mvc-4.4.0.jar) をダウンロードしてクラスパスに配置します。

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>spring-mock-mvc</artifactId>
      <version>4.4.0</version>
      <scope>test</scope>
</dependency>
```

<!-- Or [download](http://dl.bintray.com/johanhaleby/generic/spring-mock-mvc-4.4.0-dist.zip) it from the download page if you're not using Maven. -->

#### Bootstrapping RestAssuredMockMvc

<!-- First of all you should statically import methods in: -->
次のような import 文を追加するだけです。

```java
io.restassured.module.mockmvc.RestAssuredMockMvc.*
io.restassured.module.mockmvc.matcher.RestAssuredMockMvcMatchers.*
```

<!-- instead of those defined in -->
元の import 文は削除します。

```java
io.restassured.RestAssured.*
io.restassured.matcher.RestAssuredMatchers.*
```

<!-- Refer to [static import](#static-imports) section of the documentation for additional static imports. -->
他に必要な import 文があるなら [static import](#static-import) のセクションを参照してください。

<!-- In order to start a test using RestAssuredMockMvc you need to initialize it with a either a set of Controllers, a MockMvc instance or a WebApplicationContext from Spring. You can do this for a single request as seen in the previous example: -->
`RestAssuredMockMvc` のテストを実行するときは、先にコントローラや `MockMvc` や `WebApplicationContext` を初期化しておかなければなりません。
前のコード例で見たように、リクエストごとにもろもろの準備を実行できます。

```java
given().standaloneSetup(new GreetingController()). ..
```

<!-- or you can do it statically: -->
クラスメソッドで実行することもできます。

```java
RestAssuredMockMvc.standaloneSetup(new GreetingController());
```

<!-- If defined statically you don't have to specify any Controllers (or MockMvc or WebApplicationContext instance) in the DSL. This means that the previous example can be written as: -->
クラスメソッドで実行する場合、REST Assured の DSL でコントローラや `MockMvc` や `WebApplicationContext` のインスタンスを指定する必要はありません。
その場合、最初のコード例は次のように記述できます。

```java
given()
    .param("name", "Johan")
.when()
    .get("/greeting")
.then()
    .statusCode(200)
    .body("id", equalTo(1))
    .body("content", equalTo("Hello, Johan!"));
```

#### Asynchronous Requests

<!-- Both RestAssuredMockMvc and  As of version `2.5.0` RestAssuredMockMvc has support for asynchronous requests. For example let's say you have the following controller:
 -->
`RestAssured` と `RestAssuredMockMvc` は 2.5.0 からリクエストを非同期で送信できるようになりました。

```java
@Controller
public class PostAsyncController {

    @RequestMapping(value = "/stringBody", method = POST)
    public @ResponseBody
    Callable<String> stringBody(final @RequestBody String body) {
        return new Callable<String>() {
            public String call() throws Exception {
                return body;
            }
        };
    }
}
```

<!-- You can test this like so: -->
テストコードは次のように記述できます。

```java
given()
    .body("a string")
.when()
    .async().post("/stringBody")
.then()
    .body(equalTo("a string"));
```

<!-- This will use the default timeout of 1 second. You can change the timeout by using the DSL: -->
これらのコードのタイムアウト時間は初期値の1秒になっています。
タイムアウト時間は DSL で指定できます。

```java
given()
    .body("a string")
.when()
    .async().with().timeout(20, TimeUnit.SECONDS).post("/stringBody")
.then()
    .body(equalTo("a string"));
```

<!-- It's also possible to configure a default timeout by using the [AsyncConfig](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/2.4.1/io/restassured/module/mockmvc/config/AsyncConfig.html), for example: -->
[AsyncConfig](http://static.javadoc.io/io.rest-assured/spring-commons/latest/io/restassured/module/spring/commons/config/AsyncConfig.html) でもタイムアウト時間の初期値を設定できます。

```java
given()
    .config(config().asyncConfig(withTimeout(100, TimeUnit.MILLISECONDS)))
    .body("a string")
.when()
    .async().post("/stringBody")
.then()
    .body(equalTo("a string"));
```

<!-- `withTimeout` is statically imported from `io.restassured.module.mockmvc.config.AsyncConfig` and is just a shortcut for creating an `AsyncConfig` with a given timeout. Apply the config globally to apply to all requests: -->
`withTimeout` メソッドは `io.restassured.module.spring.commons.config.AsyncConfig` のクラスメソッドで、タイムアウト時間を設定しただけの `AsyncConfig` を生成します。

全てのリクエストでタイムアウト時間を変更する場合は次のように記述します。
リクエスト1とリクエスト2のどちらでも、タイムアウト時間は100ミリ秒になります。

```java
RestAssuredMockMvc.config = RestAssuredMockMvc.config().asyncConfig(
    withTimeout(100, TimeUnit.MILLISECONDS));

// リクエスト1
given()
    .body("a string")
.when()
    .async().post("/stringBody")
.then()
    .body(equalTo("a string"));

// リクエスト2
given()
    .body("another string")
.when()
    .async().post("/stringBody")
.then()
    .body(equalTo("a string"));
```

<!-- Both request 1 and 2 will now use the default timeout of 100 milliseconds. -->

#### Adding Request Post Processors

<!-- Spring MockMvc has support for [Request Post Processors](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/request/RequestPostProcessor.html) and you can use these in RestAssuredMockMvc as well. For example: -->
Spring MockMvc は [Request Post Processors](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/request/RequestPostProcessor.html) を使用できますが、`RestAssuredMockMvc` でも使用できます。

```java
given().postProcessors(myPostProcessor1, myPostProcessor2). ..
```

<!-- Note that it's recommended the add `RequestPostProcessors` from `org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors` (i.e. authentication `RequestPostProcessors`) to `auth` instead for better readability (result will be the same): -->
可読性を高めるためにも、`RequestPostProcessors` に `org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors` を指定する代わりに、`auth` メソッドを使うようにしたほうがいいでしょう。
同じ振る舞いになるはずです。

```java
given().auth().with(httpBasic("username", "password")). ..
```

<!-- where httpBasic is statically imported from [SecurityMockMvcRequestPostProcessor](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/test/web/servlet/request/SecurityMockMvcRequestPostProcessors.html). -->
`httpBasic` メソッドは [SecurityMockMvcRequestPostProcessor](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/test/web/servlet/request/SecurityMockMvcRequestPostProcessors.html) のクラスメソッドです。

#### Adding Result Handlers

<!-- Spring MockMvc has support for [Result Handlers](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/ResultHandler.html) and you can use these in RestAssuredMockMvc as well. For example let's say you want to use the native MockMvc logging: -->
Spring MockMvc は [Result Handlers](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/ResultHandler.html) を使用できますが、`RestAssuredMockMvc` でも使用できます。

`MockMvc` の提供するログ出力機能を使用するときは次のように記述します。

```java
.. .then().apply(print()). .. 
```

<!-- where `print` is statically imported from `org.springframework.test.web.servlet.result.MockMvcResultHandlers`. Note that if you're using REST Assured 2.6.0 or older you used the `resultHandlers` method: -->
`print` メソッドは `org.springframework.test.web.servlet.result.MockMvcResultHandlers` のクラスメソッドです。

REST Assured 2.6.0 より前のバージョンを使っている場合は代わりに `resultHandlers` メソッドを使うようにしてください（`resultHandlers` メソッドは 2.8.0 から非推奨になりました）。

```java
given().resultHandlers(print()). .. 
```

<!-- but this was deprected in REST Assured 2.8.0. -->

#### Using Result Matchers

<!-- Spring MockMvc provides a bunch of [Result Matchers](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/ResultMatcher.html) that you may find useful. RestAssuredMockMvc has support for these as well if needed. For example let's say that for some reason you want to verify that the status code is equal to 200 using a ResultMatcher: -->
Spring MockMvc は [Result Matchers](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/ResultHandler.html) のさまざまな実装を提供しています。
中には役に立つものもあるでしょう。
`RestAssuredMockMvc` でも同じように使用できます。

例えば、何らかの理由でステータスコードが 200 に一致するかどうか `ResultMatcher` で判定しなければならないとしたら、次のように記述できます。

```java
given()
    .param("name", "Johan")
.when()
    .get("/greeting")
.then()
    .assertThat(status().isOk())
    .body("id", equalTo(1))
    .body("content", equalTo("Hello, Johan!"));
```

<!-- where `status` is statically imported from `org.springframework.test.web.servlet.result.MockMvcResultMatchers`. Note that you can also use the `expect` method which is the same as `assertThat` but more close to the syntax of native MockMvc. -->
`status` メソッドは `org.springframework.test.web.servlet.result.MockMvcResultMatchers` のクラスメソッドです。
`assertThat` メソッドの代わりに `expect` メソッドを使えるので、そのほうが素の `MockMvc` の記法に近づくでしょう。

#### Interceptors

<!-- For more advanced use cases you can also get ahold of and modify the [MockHttpServletRequestBuilder](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/request/MockHttpServletRequestBuilder.html) before the request is performed. To do this define a [MockHttpServletRequestBuilderInterceptor](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/intercept/MockHttpServletRequestBuilderInterceptor.html) and use it with RestAssuredMockMvc: -->
[MockHttpServletRequestBuilder](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/request/MockHttpServletRequestBuilder.html) を使えば実際に送信する前にリクエストの内容を変更できます。
そのためには、[MockHttpServletRequestBuilderInterceptor](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/intercept/MockHttpServletRequestBuilderInterceptor.html) を実装して `RestAssuredMockMvc` に指定します。

```java
given().interceptor(myInterceptor). ..
```

#### <a name="specifications"></a> Spring Mock Mvc Specifications

<!-- Just as with standard Rest Assured you can use [specifications](#specification_re-use) to allow for better re-use. Note that the request specification builder for RestAssuredMockMvc is called [MockMvcRequestSpecBuilder](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/specification/MockMvcRequestSpecBuilder.html). The same [ResponseSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseSpecBuilder.html) can be used in RestAssuredMockMvc as well though. Specifications can be defined statically as well just as with standard Rest Assured. For example: -->
通常の REST Assured のように[リクエストやレスポンスの仕様](#specification-re-use)を定義して再利用性を高めることができます。
`RestAssuredMockMvc` では [MockMvcRequestSpecBuilder](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/specification/MockMvcRequestSpecBuilder.html) でリクエストの仕様を作成しますが、レスポンスの仕様は [ResponseSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseSpecBuilder.html) で作成します。

全てのリクエストやレスポンスで使用する仕様はクラスメンバ変数で変更できます。

```java
RestAssuredMockMvc.requestSpecification = new MockMvcRequestSpecBuilder()
    .addQueryParam("name", "Johan")
    .build();
RestAssuredMockMvc.responseSpecification = new ResponseSpecBuilder()
    .expectStatusCode(200)
    .expectBody("content", equalTo("Hello, Johan!"))
    .build();

given()
    .standaloneSetup(new GreetingController())
.when()
    .get("/greeting")
.then()
    .body("id", equalTo(1));
```

#### Resetting RestAssuredMockMvc

<!-- If you've used any static configuration you can easily reset RestAssuredMockMvc to its default state by calling the `RestAssuredMockMvc.reset()` method. -->
`reset` メソッドで `RestAssuredMockMvc` の初期設定を復元できます。

### Spring MVC Authentication

<!-- Version `2.3.0` of `spring-mock-mvc` supports authentication. For example: -->
`spring-mock-mvc` モジュールは 2.3.0 から認証機能に対応しました。

```java
given().auth().principal(..). ..
```

<!-- Some authentication methods require Spring Security to be on the classpath (optional). It's also possible to define authentication statically: -->
一部の認証方式を使用するには Spring Security ライブラリをクラスパスに配置しなければなりません（任意です）。
認証方式はクラスメンバ変数で変更できます。

```java
RestAssuredMockMvc.authentication = principal("username", "password");
```

<!-- where the `principal` method is statically imported from [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html). It's also possible to define an authentication scheme in a request builder: -->
`principal` メソッドは [RestAssuredMockMvc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html) のクラスメソッドです。
リクエストビルダーで認証方式を変更することもできます。

```java
MockMvcRequestSpecification spec = new MockMvcRequestSpecBuilder
    .setAuth(principal("username", "password"))
    .build();
```

#### Using Spring Security Test

<!-- Since version `2.5.0` there's also better support for Spring Security. If you have `spring-security-test` in classpath you can do for example: -->
`spring-mock-mvc` モジュールは 2.5.0 で Spring Security の対応を改善しました。
クラスパスに `spring-security-test` ライブラリがあるときは次のように記述できるようになります。

```java
given().auth().with(httpBasic("username", "password")). ..
```

<!-- where `httpBasic` is statically imported from [SecurityMockMvcRequestPostProcessor](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/test/web/servlet/request/SecurityMockMvcRequestPostProcessors.html). This will apply basic authentication to the request. For this to work you need apply the [SecurityMockMvcConfigurer](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/test/web/servlet/setup/SecurityMockMvcConfigurers.html) to the MockMvc instance. You can either do this manually: -->
`httpBasic` メソッドは [SecurityMockMvcRequestPostProcessor](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/test/web/servlet/request/SecurityMockMvcRequestPostProcessors.html) のクラスメソッドです。
このメソッドはベーシック認証ができるようにします。

この機能を有効にするには `MockMvc` のインスタンスに [SecurityMockMvcConfigurer](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/test/web/servlet/setup/SecurityMockMvcConfigurers.html) を指定しなければなりません。
直接指定する場合は次のように記述します。

```java
MockMvc mvc = MockMvcBuilders
    .webAppContextSetup(context)
    .apply(SecurityMockMvcConfigurers.springSecurity())
    .build();
```

<!-- or RESTAssuredMockMvc will automatically try to apply the `springSecurity` configurer automatically if you initalize it with an instance of [AbstractMockMvcBuilder](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/web/servlet/setup/AbstractMockMvcBuilder.html), for example when configuring a "web app context": -->
`RestAssuredMockMvc` に [AbstractMockMvcBuilder](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/web/servlet/setup/AbstractMockMvcBuilder.html) のインスタンスを指定した場合、自動的に `springSecurity` を構成します。

```java
given()
    .webAppContextSetup(context)
    .auth().with(httpBasic("username", "password")). ..
```

<!-- Here's a full example: -->
完全なコード例は次のとおりです。

```java
import io.restassured.module.mockmvc.RestAssuredMockMvc;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.web.context.WebApplicationContext;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = MyConfiguration.class)
@WebAppConfiguration
public class BasicAuthExample {

    @Autowired
    private WebApplicationContext context;

    @Before public void
    rest_assured_is_initialized_with_the_web_application_context_before_each_test() {
        RestAssuredMockMvc.webAppContextSetup(context);
    }

    @After public void
    rest_assured_is_reset_after_each_test() {
        RestAssuredMockMvc.reset();
    }

    @Test public void
    basic_auth_example() {
        given().
                auth().with(httpBasic("username", "password")).
        when().
                get("/secured/x").
        then().
                statusCode(200).
                expect(authenticated().withUsername("username"));
    }
}
```

<!-- You can also define authentication for all request, for example: -->
全てのリクエストで使用する認証方式はクラスメンバで変更できます。

```java
RestAssuredMockMvc.authentication = with(httpBasic("username", "password"));
```

<!-- where `with` is statically imported from `io.restassured.module.mockmvc.RestAssuredMockMvc`. It's also possible to use a [request specification](#specifications). -->
`with` メソッドは `io.restassured.module.mockmvc.RestAssuredMockMvc` のクラスメソッドです。
[リクエストの仕様](#specifications)で指定することもできます。

#### Injecting a User

<!-- It's also possible use to of Spring Security test annotations such as [@WithMockUser](http://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#test-method-withmockuser) and [@WithUserDetails](http://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#test-method-withuserdetails). For example let's say you want to test this controller: -->
Spring Security Test ライブラリの提供する [@WithMockUser](http://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#test-method-withmockuser) や [@WithUserDetails](http://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#test-method-withuserdetails) といったアノテーションを使用できます。

```java
@Controller
public class UserAwareController {

    @RequestMapping(value = "/user-aware", method = GET)
    public
    @ResponseBody
    String userAware(@AuthenticationPrincipal User user) {
        if (user == null || !user.getUsername().equals("authorized_user")) {
            throw new IllegalArgumentException("Not authorized");
        }

        return "Success";
    }
}
```

<!-- As you can see the `userAware` method takes a [User](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/core/userdetails/User.html) as argument and we let Spring Security inject it by using the [@AuthenticationPrincipal](http://docs.spring.io/spring-security/site/docs/current/apidocs/org/springframework/security/web/bind/annotation/AuthenticationPrincipal.html) annotation. To generate a test user we could do like this: -->
`userAware` メソッドの引数 [User](http://docs.spring.io/autorepo/docs/spring-security/current/apidocs/org/springframework/security/core/userdetails/User.html) には [@AuthenticationPrincipal](http://docs.spring.io/spring-security/site/docs/current/apidocs/org/springframework/security/web/bind/annotation/AuthenticationPrincipal.html) が指定されているため、Spring Security がユーザーオブジェクトを注入します。
次のように記述すると、テスト用のユーザーを生成できます。

```java
@WithMockUser(username = "authorized_user")
@Test public void
spring_security_mock_annotations_example() {
    given()
        .webAppContextSetup(context)
    .when()
        .get("/user-aware")
    .then()
        .statusCode(200)
        .body(equalTo("Success"))
        .expect(authenticated().withUsername("authorized_user"));
}
```

#### Spring Web Test Client Module

<!-- REST Assured 3.2.0 introduced support for testing components of the [Spring Reactive Web](https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html) stack using the `spring-web-test-client` module. This means that you can unit test reactive Spring (Webflux) Controllers. For example let's say that the server defines a controller that returns JSON using this DTO: -->
REST Assured 3.2.0 では [Spring Reactive Web](https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html) のテストに使用するコンポーネントとして `spring-web-test-client` モジュールを導入しました。
このモジュールを使用すると Spring WebFlux のコントローラのユニットテストを作成できるようになります。

次のような DTO クラスを JSON ドキュメントとして返すコントローラがあることにしましょう。

```java
public class Greeting {

    private final long id;
    private final String content;

    public Greeting(long id, String content) {
        this.id = id;
        this.content = content;
    }

    public long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }
}
```

<!-- The reactive Controller might look like this:   -->

```java
@RestController
public class GreetingController {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @GetMapping(value = "/greeting", produces = "application/json")
    public Mono<Greeting> greeting(@RequestParam(value="name") String name) {
        return Mono.just(new Greeting(counter.incrementAndGet(), String.format(template, name)));
    }
}
```

<!-- you can test it using [RestAssuredWebTestClient](http://static.javadoc.io/io.rest-assured/spring-web-test-client/latest/io/restassured/module/webtestclient/RestAssuredWebTestClient.html) like this: -->
[RestAssuredWebTestClient](http://static.javadoc.io/io.rest-assured/spring-web-test-client/latest/io/restassured/module/webtestclient/RestAssuredWebTestClient.html) を使うと次のように記述できます。

```java
package io.restassured.module.webtestclient;

import io.restassured.module.webtestclient.setup.GreetingController;
import org.junit.Test;
import static io.restassured.module.webtestclient.RestAssuredWebTestClient.given;

public class GreetingControllerTest {
    
    @Test 
    public void greeting_controller_returns_json_greeting() {
        given()
            .standaloneSetup(new GreetingController())
            .param("name", "Johan")
        .when()
            .get("/greeting")
        .then()
            .statusCode(200)
            .body("id", equalTo(1))
            .body("content", equalTo("Hello, Johan!"));
    }
}
```

<!-- i.e. it's very similar to the standard REST Assured syntax. This makes it really fast to run your tests and it's also easier to bootstrap the environment and use mocks (if needed) than standard REST Assured. Most things that you're used to in standard REST Assured works with RestAssuredWebTestClient as well. For example (certain) configuration, static specifications, logging etc etc. To use it you need to depend on the `spring-web-test-client` module: -->
REST Assured の基本的な記法そのままです。
すごい短い時間でテストを実行できるだけでなく、基本的な REST Assured に比べて、環境の準備や、（必要なら）モックを使用するのが簡単になっています。
基本的な REST Assured の準備に必要なことのほとんど（各種設定や仕様の準備、ロギング等）を `RestAssuredWebTestClient` がやってくれるからです。

Maven プロジェクトなら `spring-web-test-client` モジュールを依存ライブラリに追加します。
そうでなければ [jarファイル](https://repo1.maven.org/maven2/io/rest-assured/spring-web-test-client/latest/spring-web-test-client-4.4.0.jar) をダウンロードしてクラスパスに配置します。

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>spring-web-test-client</artifactId>
      <version>4.4.0</version>
      <scope>test</scope>
</dependency>
```

<!-- Or [download](http://dl.bintray.com/johanhaleby/generic/spring-web-test-client-4.4.0-dist.zip) it from the download page if you're not using Maven. -->

#### Bootstrapping RestAssuredWebTestClient

<!-- First of all you should statically import methods in: -->
次のような import 文を追加するだけです。

```java
io.restassured.module.webtestclient.RestAssuredWebTestClient.*
io.restassured.module.webtestclient.matcher.RestAssuredWebTestClientMatchers.*
```

<!-- instead of those defined in -->
元の import 文は削除します。

```java
io.restassured.RestAssured.*
io.restassured.matcher.RestAssuredMatchers.*
```

<!-- Refer to [static import](#static-imports) section of the documentation for additional static imports. -->
他に必要な import 文があるなら [static import](#static-import) のセクションを参照してください。

<!-- In order to start a test using RestAssuredWebTestClient you need to initialize it with a either a set of Controllers, a WebTestClient instance or a WebApplicationContext from Spring. You can do this for a single request as seen in the previous example: -->
`RestAssuredWebTestClient` のテストを実行するときは、先にコントローラや `WebTestClient` や `WebApplicationContext` を初期化しておかなければなりません。
前のコード例で見たように、リクエストごとにもろもろの準備を実行できます。

```java
given().standaloneSetup(new GreetingController()). ..
```

<!-- or you can do it statically: -->
クラスメソッドで実行することもできます。

```java
RestAssuredWebTestClient.standaloneSetup(new GreetingController());
```

<!-- If defined statically you don't have to specify any Controllers in the DSL. This means that the previous example can be written as: -->
クラスメソッドで実行する場合、REST Assured の DSL でコントローラのインスタンスを指定する必要はありません。
その場合、最初のコード例は次のように記述できます。

```java
given()
    .param("name", "Johan")
.when()
    .get("/greeting")
.then()
    .statusCode(200)
    .body("id", equalTo(1))
    .body("content", equalTo("Hello, Johan!"));
```

#### Spring Web Test Client Specifications

<!-- Just as with standard Rest Assured you can use [specifications](#specification_re-use) to allow for better re-use. Note that the request specification builder for RestAssuredWebTestClient is called [WebTestClientRequestSpecBuilder](http://static.javadoc.io/io.rest-assured/spring-web-test-client/latest/io/restassured/module/webtestclient/specification/WebTestClientRequestSpecBuilder.html). The same [ResponseSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseSpecBuilder.html) can be used in RestAssuredWebTestClient as well though. Specifications can be defined statically as well just as with standard Rest Assured. For example: -->
通常の REST Assured のように[リクエストやレスポンスの仕様](#specification-re-use)を定義して再利用性を高めることができます。
`RestAssuredWebTestClient` では [WebTestClientRequestSpecBuilder](http://static.javadoc.io/io.rest-assured/spring-web-test-client/latest/io/restassured/module/webtestclient/specification/WebTestClientRequestSpecBuilder.html) でリクエストの仕様を作成しますが、レスポンスの仕様は [ResponseSpecBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/builder/ResponseSpecBuilder.html) で作成します。

全てのリクエストやレスポンスで使用する仕様はクラスメンバ変数で変更できます。

```java
RestAssuredWebTestClient.requestSpecification = new WebTestClientRequestSpecBuilder()
    .addQueryParam("name", "Johan")
    .build();
RestAssuredWebTestClient.responseSpecification = new ResponseSpecBuilder()
    .expectStatusCode(200)
    .expectBody("content", equalTo("Hello, Johan!"))
    .build();

given()
    .standaloneSetup(new GreetingController())
.when()
    .get("/greeting")
.then()
    .body("id", equalTo(1));
```

#### Resetting RestAssuredWebTestClient

<!-- If you've used any static configuration you can easily reset RestAssuredWebTestClient to its default state by calling the `RestAssuredWebTestClient.reset()` method. -->
`reset` メソッドで `RestAssuredWebTestClient` の初期設定を復元できます。

### Common Spring Module Documentation

#### Note on parameters

<!-- Neither RestAssuredMockMvc nor RestAssuredWebTestClient differentiates between parameters types, so `param`, `formParam` and `queryParam` currently just delegates to param in MockMvc. `formParam` adds the `application/x-www-form-urlencoded` content-type header automatically though just as standard Rest Assured does. -->
`RestAssuredMockMvc` と `RestAssuredWebTestClient` はどちらも使用できるパラメータは同じで、`param` や `formParam` や `queryParam` は `MockMvc` へ委譲するだけです。
通常の REST Assured と同様に、`formParam` でパラメータを指定すると、自動的に HTTP ヘッダーの content-type へ `application/x-www-form-urlencoded` を設定します。

## Scala Support Module

<!-- REST Assured 2.6.0 introduced the [scala-support](http://dl.bintray.com/johanhaleby/generic/scala-support-4.4.0-dist.zip) module that adds an alias to the "then" method defined in the [Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) or [MockMvcResponse](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/response/MockMvcResponse.html) called "Then". The reason for this is that `then` might be a reserved keyword in Scala in the future and the compiler issues a warning when using a method with this name. To enable the use of `Then` simply import the `io.restassured.module.scala.RestAssuredSupport.AddThenToResponse` class from the `scala-support` module. For example: -->
REST Assured 2.6.0 で導入された [scala-support](https://repo1.maven.org/maven2/io/rest-assured/scala-support/latest/scala-support-4.4.0.jar) モジュールは、[Response](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/response/Response.html) と [MockMvcResponse](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/response/MockMvcResponse.html) の "then" メソッドに、別名の "Then" メソッドを追加します。
Scala では `then` が予約語になっているため、Scala コンパイラが警告メッセージを出力するからです。
`Then` メソッドを使用するには `scala-support` モジュールの `io.restassured.module.scala.RestAssuredSupport.AddThenToResponse` を import 文に追加します。

```java
import io.restassured.RestAssured.when
import io.restassured.module.scala.RestAssuredSupport.AddThenToResponse
import org.hamcrest.Matchers.equalTo
import org.junit.Test

@Test
def `trying out rest assured in scala with implicit conversion`() {
  when().
    get("/greetJSON").
  Then().
    statusCode(200).
    body("key", equalTo("value"))
}
```

<!-- Note that this is also supported for the [Spring Mock Mvc Module](#spring-mock-mvc-module). -->
[spring-mock-mvc モジュール](#spring-mock-mvc-module) を使用する場合も同じようにします。

<!-- To use it do like this: -->
`scala-support` モジュールを依存ライブラリに追加するには次のように記述します。

##### SBT:

```scala
libraryDependencies += "io.rest-assured" % "scala-support" % "4.4.0"
```

##### Maven:

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>scala-support</artifactId>
    <version>4.4.0</version>
    <scope>test</scope>
</dependency>
```

##### Gradle:

```xml
testImplementation 'io.rest-assured:scala-support:4.4.0'
```

#### No build manager:

<!-- Download the [distribution file](http://dl.bintray.com/johanhaleby/generic/scala-support-4.4.0-dist.zip) manually. -->
クラスパスに [jar ファイル](https://repo1.maven.org/maven2/io/rest-assured/scala-support/latest/scala-support-4.4.0.jar) を配置してください。

## Kotlin

### Avoid Escaping "when" Keyword

<!-- Kotlin is a language developed by [JetBrains](https://www.jetbrains.com/) and it integrates very well with Java and REST Assured. When using it with REST Assured there's one thing that can be a bit annoying. That is you have to escape `when` since it's a reserved keyword in Kotlin. You can do this either by using [Kotlin Extension Module](#kotlin-extension-module) (recommended) or you can simply create your own extension method (the approach shown below). For example: -->
[JetBrains](https://www.jetbrains.com/) の開発している Kotlin 言語はとても簡単に Java と統合できるので、REST Assured も簡単に利用できます。
ただし、1つだけ注意点があります。
Kotlin では `when` が予約語になっているため、メソッド名をエスケープしなければならないのです。

```kotlin
@Test 
fun `kotlin rest assured example`() {
    given().
        param("firstName", "Johan").
        param("lastName", "Haleby").
    `when`().
        get("/greeting").
    then().
        statusCode(200).
        body("greeting.firstName", equalTo("Johan")).
        body("greeting.lastName", equalTo("Haleby"))
}
```

<!-- To get around this, create an [extension function](https://kotlinlang.org/docs/reference/extensions.html) that creates an alias to `when` called `When`: -->
[Kotlin Extension Module](#kotlin-extension-module) を使用すれば、簡単に [拡張メソッド](https://kotlinlang.org/docs/reference/extensions.html) を作成できるので、こちらの方がおすすめです。

例えば、`when` メソッドの別名 `When` メソッドを定義するには次のように記述します。

```kotlin
fun RequestSpecification.When(): RequestSpecification {
    return this.`when`()
}
```

<!-- The code can now be written like this: -->
そうすると、前のコードは次のように記述できます。

```kotlin
@Test 
fun `kotlin rest assured example`() {
    given().
        param("firstName", "Johan").
        param("lastName", "Haleby").
    When().
        get("/greeting").
    then().
        statusCode(200).
        body("greeting.firstName", equalTo("Johan")).
        body("greeting.lastName", equalTo("Haleby"))
}
```

<!-- Notice that we don't need any escaping anymore. For more details refer to [this](http://code.haleby.se/2015/11/06/rest-assured-with-kotlin/) blog post. -->
メソッド名のエスケープが不要になりました。
より詳しい内容は [Johan Haleby のブログ記事](https://code.haleby.se/2015/11/06/rest-assured-with-kotlin/) を参照してください。

### Kotlin Extension Module

<!-- REST Assured 4.1.0 introduced a new module called "kotlin-extensions". This modules provides some useful extension functions when working with REST Assured from Kotlin. First you need to add the module to the project: -->
REST Assured 4.1.0 では `kotlin-extensions` モジュールを導入しました。
このモジュールは Kotlin から REST Assured を使用するときに便利な拡張関数を提供します。

Maven プロジェクトなら次のような依存ライブラリを追加します。

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>kotlin-extensions</artifactId>
    <version>4.4.0</version>
    <scope>test</scope>
</dependency>
```

<!-- and then import `Given` from the `io.restassured.module.kotlin.extensions` package. You can then use it like this: -->
そして、`io.restassured.module.kotlin.extensions` パッケージの `Given` クラスを import 文に追加すると、次のように記述できます。

```kotlin
val message: String =
Given {
    port(7000)
    header("Header", "Header")
    body("hello")
} When {
    put("/the/path")
} Then {
    statusCode(200)
    body("message", equalTo("Another World"))
} Extract {
    path("message")
}
```

<!-- Besides a more pleasing API for Kotlin developers it also has a couple of major benefits to the Java API:

1. All failed expectations are reported at the same time
2. Formatting the code in your IDE won't mess up indentation -->
このモジュールは Kotlin 開発者にとって使いやすい API を提供するだけでなく、Java API として利用する場合でも次のような利点があります。

1. 失敗した期待値の評価をまとめて報告できるようになります
2. IDE でソースコードを整形してもきれいにインデントされます

<!-- Note that the names of the extension functions are subject to change in the future (although it's probably not likely). You can read more about the rationale and benefits of the Kotlin API in [this](http://code.haleby.se/2019/09/06/rest-assured-in-kotlin/) blog post. -->
拡張メソッドの名前は将来的に変更される可能性があります。
Kotlin 用の API に関する原則や利点については [John Haleby のブログ記事](https://code.haleby.se/2019/09/06/rest-assured-in-kotlin/) を参照してください。

### Kotlin Extension Module for Spring MockMvc

<!-- REST Assured 4.1.0 introduced Kotlin extension support for the [Spring MockMvc](#spring-mock-mvc-module) module. This allows one to write tests like this: -->
REST Assured 4.1.0 では [spring-mock-mvc モジュール](#spring-mock-mvc-module) の Kotlin 拡張に対応する `spring-moc-mvc-kotlin-extensions` モジュールを導入しました。
次のように記述できます。

```kotlin
class RestAssuredMockMvcKotlinExtensionsTest {

    @Test
    fun example() {
        val mockMvc =
            MockMvcBuilders.standaloneSetup(GreetingController())
                .build()

        val id: Int =
        Given {
            mockMvc(mockMvc)
            param("name", "Johan")
        } When {
            get("/greeting")
        } Then {
            body(
                "id", Matchers.equalTo(1),
                "content", Matchers.equalTo("Hello, Johan!")
            )
        } Extract {
            path("id")
        }

        assertThat(id).isEqualTo(1)
}
```

<!-- To use it depend on: -->
Maven プロジェクトなら次のような依存ライブラリを追加します。

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>spring-mock-mvc-kotlin-extensions</artifactId>
    <version>4.4.0</version>
    <scope>test</scope>
</dependency>
```

<!-- and import the extension functions from the `io.restassured.module.mockmvc.kotlin.extensions` package. -->
必要な拡張関数を `io.restassured.module.mockmvc.kotlin.extensions` パッケージから import してください。

## More info

For more information refer to the [javadoc](http://static.javadoc.io/io.rest-assured/rest-assured/latest/index.html):
  * [RestAssured](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/RestAssured.html)
  * [RestAssuredMockMvc Javadoc](http://static.javadoc.io/io.rest-assured/spring-mock-mvc/latest/io/restassured/module/mockmvc/RestAssuredMockMvc.html)
  * [Specification package](http://static.javadoc.io/io.rest-assured/rest-assured/latest/io/restassured/specification/package-summary.html)

You can also have a look at some code examples:
  * REST Assured [tests](https://github.com/rest-assured/rest-assured/tree/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java)
  * [JsonPathTest](https://github.com/rest-assured/rest-assured/blob/master/json-path/src/test/java/io/restassured/path/json/JsonPathTest.java)
  * [XmlPathTest](https://github.com/rest-assured/rest-assured/blob/master/xml-path/src/test/java/io/restassured/path/xml/XmlPathTest.java)

If you need support then join the [mailing list](http://groups.google.com/group/rest-assured).

For professional support please contact [johanhaleby](https://github.com/johanhaleby).
