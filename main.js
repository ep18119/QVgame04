// phina.js をグローバル領域に展開
phina.globalize();

//横方向の長さ
var stageW = 5;
//縦方向の長さ
var stageH = 5;
//レイヤーの数
var layer = stageW + stageH -1;
//盤面情報
var setStage = [ [ 5, 1, 3, 3, 3]
				,[ 0, 0, 0, 0, 1]
				,[ 3, 1, 0, 0, 3]
				,[ 0, 1, 0, 0, 0]
				,[ 0, 3, 3, 1, 21] ];
//ブロック同士の幅
var stageSize = 124;
//基点
var setPosition = {x:320, y:480};

//ブロック数
var countStage = 0;
//キャラクター数
var countChara = 0;
//アイテム数
var countItem = 0;

//ブロック情報
var stage = new Array();
//キャラクター情報
var chara = new Array();
//アイテム情報
var item  = new Array();


//アセット
var ASSETS = {
	//画像
	image: {
		'stage01': './stage01.png',
		'chara01': './chara01.png',
		'item01' : './item01.png',
	},
	//アニメーション
	spritesheet: {
		'chara01_ss':{
			"frame":{
				"width":120,  //1画像の幅
				"height":205, //1画像の高さ
				"rows":2, //右方向の画像の数
				"cols":2, //下方向の画像の数
			},
			"animations":{
				//右下
				"v0":{
					"frames":[3],
					"next":"v0",
					"frequency":30,
				},
				//右上
				"v1":{
					"frames":[1],
					"next":"v1",
					"frequency":30,
				},
				//左下
				"v3":{
					"frames":[2],
					"next":"v3",
					"frequency":30,
				},
				//左上
				"v2":{
					"frames":[0],
					"next":"v2",
					"frequency":30,
				},
			},
		},
	},
};

//次の行動
var nextMove = "";
//行動終了のフラグ
var goNext = false;
//レイヤー更新のフラグ？　使ってない
var resetPos = true;

//ブロックのクラス
phina.define("Stage", {
	superClass: 'Sprite',
	init: function() {
		this.superInit('stage01');
	}
})

//アイテムのクラス
phina.define("Item", {
	superClass: 'Sprite',
	init: function() {
		this.superInit('item01');
		this.origin.set(0.5, 0.95);
		this.setScale(0.5, 0.5);
		this.p = {x:0, y:0};
		this.setWidth = this.width; //画像の幅の固定　アニメーション用
		this.setY = this.y; //y座標の固定　アニメーション用
		this.count = 60; //1周期にかかる時間[f(?)]
		this.counter = 0; //現在の時間
	},
	update: function() {
		//アニメーション
		this.width = this.setWidth * Math.sin(this.counter * (Math.PI / 180));
		this.y = this.setY + 4*Math.cos(this.counter * (Math.PI / 180));
		this.counter = (this.counter + 360/this.count) % 360;
		//キャラクターとの接触時(座標一致)の処理
		for(var i=0; i<countChara; i++){
			if(chara[i].p.x == this.p.x && chara[i].p.y == this.p.y){
				countItem--;
				this.remove(); //スプライトを削除
			}
		}
	},
})

//キャラクターのクラス
phina.define("Player", {
	superClass: 'Sprite',
	init: function() {
		this.superInit('chara01', 120, 205); //1画像のサイズが(120, 205)
		var anim = FrameAnimation('chara01_ss').attachTo(this); //アニメーションの適応
		//anim.fit = false; //なにこれ
		anim.gotoAndPlay('v0'); //最初画像
		this.anim = anim; //スプライトに適応
		this.origin.set(0.5,0.95); //原点
		this.setScale(0.7, 0.7); //拡大率
		//現在値の座標
		this.p = {x:0, y:0};
		//前方の座標　できれば使いたくない
		this.np = {x:1, y:0};
		//x座標
		this.x = setPosition.x + (this.p.x - this.p.y) * stageSize / 2;
		//y座標
		this.y = setPosition.y + (this.p.x + this.p.y) * stageSize / 4;
		//向き 0:右下、1:右上、2:左上、3:左下
		this.d = 0;
		//移動可能かどうかの判定
		this.checkD = {v0:false, v1:false, v2:false, v3:false};

		//移動時間[f]
		this.moveFrame = 10;
		//残り移動時間[f]
		this.remainFrame = 0;
	},

	update: function() {
		//次の命令が来た場合の処理
		if(nextMove && ! this.remainFrame){
			switch (nextMove) {
				case "左上" :
					this.d = 2;
					this.changeD();
					goNext = true; //処理完了
					break;
				case "右上" :
					this.d = 1;
					this.changeD();
					goNext = true;
					break;
				case "左下" :
					this.d = 3;
					this.changeD();
					goNext = true;
					break;
				case "右下" :
					this.d = 0;
					this.changeD();
					goNext = true;
					break;
				case "前進" :
					if(this.checkD.v0){
						this.p.x += this.np.x;
						this.p.y += this.np.y;
						this.remainFrame = this.moveFrame;
					}
					else goNext = true;
					break;
				case "右回転" :
					this.d = (this.d + 3) % 4;
					this.changeD();
					goNext = true;
					break;
				case "左回転" :
					this.d = (this.d + 1) % 4;
					this.changeD();
					goNext = true;
					break;
				default :
					goNext = true;
					break;
			}
		}

		//移動中の処理
		if(this.remainFrame){
			//移動完了時
			if(--this.remainFrame == 0){
				goNext = true;
			}
			//現在の座標
			var nowPosition = {x: this.p.x - this.np.x * this.remainFrame*this.remainFrame / (this.moveFrame*this.moveFrame), y: this.p.y - this.np.y * this.remainFrame*this.remainFrame / (this.moveFrame*this.moveFrame)}
			//xy座標
			this.x = setPosition.x + (nowPosition.x - nowPosition.y) * stageSize / 2;
			this.y = setPosition.y + (nowPosition.x + nowPosition.y) * stageSize / 4;
		}

		//各方向が移動可能かの確認
		if (goNext) this.checkDo();
	},

	//各方向が移動可能かの確認
	checkDo: function() {
		//各方向の先の座標
		var np0 = new Array();
		//前方
		np0[0] = {x : this.np.x, y : this.np.y};
		for (var i=0; i<4; i++){
			//前方以外
			if(i>0) np0[i] = {x:np0[i-1].y, y:-np0[i-1].x};
			//確認　配列が参照できない場合があるため、try-catch文を利用している
			try{
				if(setStage[this.p.y + np0[i].y][this.p.x + np0[i].x] & 1){
					this.checkD['v' + i] = true;
				}else this.checkD['v' + i] = false;
			}catch {this.checkD['v' + i] =false;}
		}
	},

	//向き(this.d)に対応した画像とnpの更新
	changeD: function() {
		this.anim.gotoAndPlay('v' + this.d);
		switch(this.d){
			case 0: this.np = {x:1, y:0}; break;
			case 1: this.np = {x:0, y:-1}; break;
			case 2: this.np = {x:-1, y:0}; break;
			case 3: this.np = {x:0, y:1}; break;
		}
	},
})

//ボタンのクラス　デバッグ用
phina.define("MoveButton", {
	superClass: 'Button',
	init: function() {
		this.superInit({
		x: 1,             // x座標
		y: 1,             // y座標
		width: 40,         // 横サイズ
		height: 32,        // 縦サイズ
		text: "",     // 表示文字
		fontSize: 16,       // 文字サイズ
		fontColor: '#000000', // 文字色
		cornerRadius: 3,   // 角丸み
		fill: '#ffffff',    // ボタン色
		stroke: 'black',     // 枠色
		strokeWidth: 1,     // 枠太さ
		});
		this.origin.set(0,0);
		//クリック時の処理　文字をそのまま次の処理として格納する　処理が未完了なら反応しない
		this.onpointend = function(){
			if(! nextMove){
				nextMove = this.text;
			}
		}
	}
})

//ラベルのクラス　デバッグ用
phina.define("CheckGo", {
	superClass: 'Label',
	init: function() {
		this.superInit({
			x: 640,
			y: 20,
		});
		this.origin.set(1,0);
	}
})

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit();
    // 背景色を指定
    this.backgroundColor = 'skyblue';
    //スプライト
	//ステージの表示
	stage = new Array();　//ブロック情報の初期化
	countStage = 0; //ブロック数の初期化
	for (var i=0; i<5; i++){ //縦方向
		for(var j=0; j<5; j++){ //横方向
			if(setStage[i][j] & 1){
				console.log("A");
				stage[countStage] = Stage().addChildTo(this);
				stage[countStage].x = setPosition.x + (j - i) * stageSize / 2;
				stage[countStage].y = setPosition.y + (j + i) * stageSize / 4;
				stage[countStage].origin.set(0.5, 0.25);
				countStage++;
			}
		}
	}

	//レイヤーの準備　必要数準備するだけ
	this.layer = new Array();
	for (var i=0; i<layer; i++){
		console.log("C");
		this.layer[i] = DisplayElement().addChildTo(this);
	}
	
	//キャラクターとアイテムの表示
	chara = new Array(); //キャラクター情報の初期化
	item  = new Array(); //アイテム情報の初期化
	countChara = 0; //キャラクター数の初期化
	countItem  = 0; //アイテム数の初期化
	for (var i=0; i<5; i++){
		for(var j=0; j<5; j++){
			if(setStage[i][j] & 1){ //前提としてマスがある
				if(setStage[i][j] & 4){ //キャラクター
					console.log("B");
					chara[countChara] = Player();
					chara[countChara].p = {x:j, y:i};
					chara[countChara].x = setPosition.x + (chara[countChara].p.x - chara[countChara].p.y) * stageSize / 2;
					chara[countChara].y = setPosition.y + (chara[countChara].p.x + chara[countChara].p.y) * stageSize / 4;
					chara[countChara].d = setStage[i][j] >> 3; //下から4,5桁目の情報から向きを判別
					chara[countChara].changeD(); //向き情報の更新
					chara[countChara].checkDo(); //各方向が移動可能か
					chara[countChara].addChildTo(this.layer[chara[countChara].p.x + chara[countChara].p.y]); //座標に応じたレイヤーに描画
					countChara++;
				}
				if(setStage[i][j] & 2){ //アイテム
					console.log("D");
					item[countItem] = Item();
					item[countItem].p = {x:j, y:i};
					item[countItem].x = setPosition.x + (j - i) * stageSize / 2;
					item[countItem].y = setPosition.y + (j + i) * stageSize / 4;
					item[countItem].setY = item[countItem].y;
					item[countItem].addChildTo(this.layer[j + i]);
					countItem++;
				}
			}
		}
	}

	//ボタン表示
	var button0 = MoveButton().addChildTo(this);
	button0.x = 0;
	button0.y = 0;
	button0.text = "左上";
	var button1 = MoveButton().addChildTo(this);
	button1.x = 42;
	button1.y = 0;
	button1.text = "右上";
	var button2 = MoveButton().addChildTo(this);
	button2.x = 0;
	button2.y = 34;
	button2.text = "左下";
	var button3 = MoveButton().addChildTo(this);
	button3.x = 42;
	button3.y = 34;
	button3.text = "右下";
	var button4 = MoveButton().addChildTo(this);
	button4.x = 0;
	button4.y = 68;
	button4.width = 82;
	button4.text = "前進";
	var button5 = MoveButton().addChildTo(this);
	button5.x = 0;
	button5.y = 102;
	button5.text = "左回転";
	var button6 = MoveButton().addChildTo(this);
	button6.x = 42;
	button6.y = 102;
	button6.text = "右回転";

	//ラベルの表示
	this.labels = new Array();
	for (var i=0; i<countChara; i++){
		this.labels[i] = CheckGo().addChildTo(this);
		this.labels[i].y = 0 + 72 * i;
		this.labels[i].text = 'chara[' + i + '] (前,左,右,後)\n= (' + chara[i].checkD.v0 + ',' + chara[i].checkD.v1 + ',' + chara[i].checkD.v3 + ',' + chara[i].checkD.v2 + ')'
	}
  },

  update: function() {
	//処理完了時の後処理
  	if(goNext){
		goNext = false;
		nextMove = "";
	}
	//レイヤーの更新
	for(var i=0; i<countChara; i++){
		chara[i].addChildTo(this.layer[chara[i].p.x + chara[i].p.y]);
	}
	//ラベルの更新
	for (var i=0; i<countChara; i++){
		this.labels[i].text = 'chara[' + i + '] (前,左,右,後)\n= (' + chara[i].checkD.v0 + ',' + chara[i].checkD.v1 + ',' + chara[i].checkD.v3 + ',' + chara[i].checkD.v2 + ')'
	}

  }
});

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'main', // メインシーンから開始する
	assets: ASSETS,
  });
  // アプリケーション実行
  app.run();
});
