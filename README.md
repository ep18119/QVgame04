# QVgame04
クォータービューゲーム試作4

## 操作方法
右上のボタンをいろいろクリックする

## 盤面情報
前提として5×5マスで作成する<br>
二次元配列setStageにビット単位で情報を書き込む<br>

0：なにもない<br>
+1：ブロック配置<br>
以下の情報はブロック配置が前提<br>
+2：アイテム配置<br>
+4：キャラクター配置<br>
以下の情報はキャラクター配置が前提<br>
+0：初期方向 右下<br>
+8：初期方向 右上<br>
+16：初期方向 左上<br>
+24：初期方向 左下<br>
