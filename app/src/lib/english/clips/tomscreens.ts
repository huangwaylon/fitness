// “Tom's Screen Ban | Parks and Recreation” (the official Parks and Recreation channel, Season 5): banned from screens
// for a week, Tom gets lost driving to work, despairs at Jerry's email habits, and goes to Ron's cabin to detox, where
// Ron's “talk it all out” idea opens a flood about every site and app he loves.
// Segments from the captions, words from whisper (2026-11-16). Untested: the “LaRon James” greeting (a pun on a
// player's name), 27.4 s (“could click” vs “clicked”), 69.0 s (“get me” vs “give me a ride”), 98.4 s (whisper
// “in Google's”), 118.9 s (“shouties” vs “shout-outs”), 83.0 s (Paul Bunyan, world knowledge), and 131–144 s and
// 166.7–175 s (a sex-tape mention and Tom's riff on “racist” emoji), kept out of every segment.
// EAR CHECK: 122.6 s r1 — the cut falls after Ron's “See, that was easy” and before Tom's “Then I like to go on Reddit”
// REVIEW 2026-11-16: pass 7, fix 15, drop 1, new 0; ear checks 1 (h4's went with the item)
import type { Clip } from '../types.ts';

export const tomScreenBan: Clip = {
  id: 'tomscreens', video: 'SxvDvGe-2fY', title: 'Tom’s Screen Ban', dur: 211, wpm: 174, band: 'fast',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): the "yes, but only if…" filler went; the new distractor keeps the key's shape with a yes
    // why: yes-then ← a breakfast question usually gets a yes, and the lateness comes after; too late ← "late" heard
    //   as "too late for breakfast"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'late', seg: [0.4, 5.6],
      stem: 'What does Ron’s reply to Tom’s breakfast question do?',
      choices: ['Skips the question and points out he’s late', 'Says yes, then points out he’s late',
                'Says no, since it’s too late for breakfast'], a: 0,
      cue: '質問への返事に、yes か no があるか。',
      line: '…*an hour and a half late for work*.',
      said: '朝食の約束には答えず、「1時間半の遅刻だ」と言う。',
      mean: '質問を無視して遅刻を指摘する返し方。冗談めかした挨拶には乗らない。',
      trap: '質問には yes か no で答えると思いやすい。英語でも、答えずに話を変える返事は多い。',
      use: 'We still on for lunch?（ランチの約束、まだ有効？）' },

    // why: half an hour ← "and a half" heard alone; an hour ← "and a half" lost at speed; two and a half ← "an"
    //   heard as "and"
    { id: 'n1', skill: 'number', level: 'B1', point: 'late', seg: [2.3, 5.6], keep: true,
      stem: 'How late is Tom for work?',
      choices: ['Half an hour', 'An hour', 'An hour and a half', 'Two and a half hours'], a: 2,
      cue: '「late」の直前の数字。',
      line: '…*an hour and a half* late for work.',
      said: '「仕事に1時間半遅れている」と言われる。',
      mean: 'an hour and a half ＝ 1時間半。',
      trap: 'an hour and a half は「アナワラナハーフ」とつながる。half だけだと30分に聞こえる。',
      use: 'The flight is an hour and a half.（フライトは1時間半です）' },

    // R fix: V2 (blind 70 %): the key's scare quotes (“solution”) were the cue, and "never made it to work" was refuted
    //   by his being there; the new distractor is a GPS fix
    // why: GPS working ← "figured it out" right after "GPS"; broken GPS ← "can't use my GPS" heard as the GPS not
    //   working
    { id: 'h1', skill: 'humor', level: 'C1', point: 'circles', seg: [7.6, 12],
      stem: 'Why does Tom’s “I figured it out” get a laugh?',
      choices: ['His big fix was just driving around lost', 'He got his GPS working again on the way',
                'He blames a broken GPS for being so late'], a: 0,
      cue: '「figured it out」のあと、何をしたと言うか。',
      line: 'But I *figured it out*. I just *drove around in circles* until I saw something familiar.',
      said: '「でも解決した。見覚えのある所に出るまで、ぐるぐる走っただけ」と言う。',
      mean: '「解決した」と胸を張るが、方法はただ迷い続けること。言葉と中身の差が笑い。',
      trap: 'GPS が使えないのは故障ではなく禁止のせい。figured it out のあとの中身を聞く。',
      use: 'I found it in the end, somehow.（なんとか最後には見つけた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'circles', seg: [8.9, 11.9],
      stem: 'Type what Tom says: “I just ___ until I saw something familiar.” (4 words)',
      answer: 'drove around in circles',
      cue: '「I just」のあと。語と語がつながる。',
      line: 'I just *drove around in circles* until I saw something familiar.',
      said: '「見覚えのある所に出るまで、ぐるぐる走り回った」。',
      mean: 'drive around in circles ＝ 同じ所をぐるぐる回る。迷ったときの言い方。',
      trap: 'drove‿around‿in は「ドロウヴァラウンディン」とつながる。in はほぼ「ン」。',
      use: 'We’re going around in circles here.（話が堂々めぐりだね）' },

    // why: 3 ← Ron's round figure just before; 4.3 ← the digits swapped; 34 ← "point" lost
    { id: 'n2', skill: 'number', level: 'B1', point: 'miles', seg: [11.5, 15.4], keep: true,
      stem: 'How far does Tom live from work, by his own GPS?',
      choices: ['3 miles', '3.4 miles', '4.3 miles', '34 miles'], a: 1,
      cue: '「according to my GPS」の前の数字。',
      line: 'You live three miles from here. — *3.4*, according to my GPS',
      said: '「3マイルだろ」に、「GPSでは3.4マイル」と言い直す。',
      mean: '3.4 は three point four と読む。細かく直すのが、GPS 頼りの彼らしい。',
      trap: '先に聞こえる three に引かれやすい。point が聞こえたら小数。',
      use: 'It’s about two point five kilometers.（だいたい2.5キロです）' },

    // C2: exact weak words in fast speech
    // anchor: 15.9–16.8 s right after "according to my GPS", five weak words in under a second; both sources have
    //   "which I used to use"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'usedto', reveals: ['miles'], seg: [14.3, 17.15],
      stem: 'Type the words: “…according to my GPS, ___ every day.” (5 words)',
      answer: 'which i used to use',
      cue: '「GPS」のすぐあと。use が2回聞こえるか。',
      line: '3.4, according to my GPS, *which I used to use* every day.',
      said: '「GPSでは3.4。毎日使ってたのにね」と足す。5語が弱く、ひと続き。',
      mean: 'used to use ＝「前は使っていた」。今は使えない不満をさりげなく足す。used to は「ユーストゥ」。',
      trap: 'use が2回続くので1つにまとめたくなる。文法で削らず、聞こえた語を全部書く。',
      use: 'This is where I used to live.（ここが前に住んでいた所）' },

    // R fix: V2/K6/S1 (blind 75 %): "really" in the stem pointed at a hidden state and the key was the only nuanced
    //   choice; the distractors are now the face-value reading and pride in the paper board
    // why: getting used to it ← "I'm adapting" taken at face value; proud ← "I built a real life Pinterest board" said
    //   like a boast
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'adapting', seg: [16.9, 29],
      stem: 'When Tom says he is adapting, how is he doing?',
      choices: ['Acting fine while clearly missing screens', 'Calmly getting used to life without them',
                'Proud of the clever workaround he found'], a: 0,
      cue: '「adapting」のあと、自分で作った物と最後の一言。',
      line: 'Big deal, *I’m adapting*. I built a *real life Pinterest board*.',
      said: '「大したことない、慣れてきた。本物のピンタレストボードを作った」と言う。',
      mean: '画面の代わりに紙で同じ物を作っている。平気なふりだが、画面が恋しいのが分かる。',
      trap: '作った物の話は自慢に聞こえるが、すぐ「クリックできたらな」と嘆く。続く本音を聞く。',
      use: 'It’s fine. I’m getting used to it.（大丈夫、慣れてきたよ）' },

    // R fix: K2: "a site that no longer works" is true of AltaVista by world knowledge; it's now a mistyped address
    //   (blind 55 %)
    // why: password ← a common reason people take odd routes to their email; wrong address ← "yahoo.com" heard, so
    //   the typing seems to be the problem
    { id: 'i2', skill: 'infer', level: 'C1', point: 'jerry', seg: [33, 39.6],
      stem: 'What does Tom’s question about Jerry’s email routine show?',
      choices: ['Jerry takes a long way round to reach it', 'Jerry has forgotten his email password',
                'Jerry types the wrong address to reach it'], a: 0,
      cue: '検索サイトに何と打ち込むか。',
      line: 'you go to AltaVista and type *please go to yahoo.com*?',
      said: '「メールを見るのに、検索サイトで『yahoo.com に行って』と打つの？」と驚く。',
      mean: 'アドレスを直接入れずに遠回りしている。ネットに不慣れなことを、例一つで示す。',
      trap: 'yahoo.com で打ち方のミスに思えるが、打つ先は検索サイト。',
      use: 'Is there a quicker way to do this?（もっと早いやり方ある？）' },

    // R fix: V2 (blind 55 %): "worried he'll break something" was a filler; now pity. "uses it" had no referent
    // why: amused ← "God, Jerry" can be a fond groan; sorry for him ← "God, Jerry" as 「かわいそうに」, Jerry as never
    //   taught
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'deserve', seg: [41.5, 46],
      stem: 'After Jerry asks what bookmarks are, how does Tom react?',
      choices: ['Fed up with how badly Jerry uses the web', 'Amused by Jerry’s old-fashioned habits',
                'Sorry for Jerry, who was never shown how'], a: 0,
      cue: '「God, Jerry」のあと、deserve の使い方。',
      line: 'God, Jerry, *you don’t deserve the internet*.',
      said: '「ジェリー、君にインターネットはもったいない」と言う。',
      mean: 'don’t deserve ＝ 持つ資格がない。使いこなせない相手へのあきれ。',
      trap: 'God, Jerry を笑い混じりの呼びかけと取ると、面白がっているように聞こえる。続く言葉で判断。',
      use: 'Honestly, you don’t deserve me.（正直、君にはもったいないよ）' },

    // R fix: V2 (blind 65 %) and N7: "with no power" in the key and 電気もない in mean gave i3's key; the "days off"
    //   filler became the week-long ban
    // why: find his way ← the GPS story at the start; busy till the week is up ← "I can't use screens for a week" +
    //   a cabin = somewhere to wait it out
    { id: 'g1', skill: 'gist', level: 'B1', point: 'detox', seg: [43.5, 72.5],
      stem: 'Why does Ron take Tom to his cabin?',
      choices: ['To break his habit, far from any screens', 'To teach him to find his way without GPS',
                'To keep him busy until his week is up'], a: 0,
      cue: '「lunatic」のあとの短い一語と、小屋の説明。',
      line: 'You need to *detox*. Tomorrow, we’ll go to my *cabin in the woods*.',
      said: '紙のスマホを見て「正気じゃない。デトックスが必要だ」と言い、森の小屋に連れて行く。',
      mean: 'detox ＝ 依存から抜けること。文明から遠い小屋で、画面から離れさせる計画。',
      trap: '冒頭の GPS の話が長いので道案内の練習に見えるが、ロンの目的は画面断ち。',
      use: 'I need a digital detox.（スマホ断ちが必要だ）' },

    // R fix: V2 (blind 80 %): "power" in the key echoed "electric company"; the new distractor reads "not even aware"
    //   as a secret
    // why: hard to find ← "far away" + Tom's getting lost; secret ← "not even aware there's a structure" heard as
    //   nobody being told
    { id: 'i3', skill: 'infer', level: 'B2', point: 'cabin', seg: [57.8, 66.6],
      stem: 'What does Ron’s line about the electric company tell us about the cabin?',
      choices: ['It is so far out that it has no power', 'It is too remote for Tom to find alone',
                'Ron keeps it a secret from everyone'], a: 0,
      cue: '「electric company」が何を知らないか。',
      line: 'so far away from civilization, *the electric company is not even aware* there’s a structure there.',
      said: '「文明から遠すぎて、電力会社は建物があることすら知らない」と言う。',
      mean: '電気が来ていない、つまり画面も使えない場所だと遠回しに言っている。',
      trap: 'far away だけ拾うと行き方の話に聞こえる。電力会社の話は「電気がない」ということ。',
      use: 'There’s no signal out there.（あそこは電波が入らない）' },

    // why: car broke ← "drove around" at the start + needing a ride; after dark ← "after work" heard as a timing
    //   reason
    { id: 'd4', skill: 'detail', level: 'B1', point: 'ride', seg: [66.7, 72.3],
      stem: 'Why does Tom want a ride home after work?',
      choices: ['He’s sure he can’t find his way home', 'His car broke down on the way in',
                'He doesn’t like driving after dark'], a: 0,
      cue: '「after work」のあとの文。',
      line: '*There’s no chance I can find my way home*.',
      said: '「家までの道が分かるわけがない」と理由を言う。',
      mean: 'There’s no chance ～ ＝ 〜なんて絶対ない。GPS なしでは帰れないということ。',
      trap: '冒頭で車で迷った話があるので、車の故障に結びつけやすい。理由はすぐあとで言っている。',
      use: 'There’s no chance I’ll finish today.（今日中に終わるわけがない）' },

    // why: can't ← "no chance I can't" feels right after a negative; could/couldn't ← the weak "can" sounds like
    //   "c'n"/"could"
    { id: 's1', skill: 'sound', level: 'B2', point: 'ride', seg: [69.3, 72.3],
      stem: 'Fill the gap: “There’s no chance I ___ find my way home.”',
      choices: ['can', 'can’t', 'could', 'couldn’t'], a: 0,
      cue: '「no chance I」のあと、とても短い一語。',
      line: 'There’s no chance I *can* find my way home.',
      said: '「家に帰れる見込みはゼロ」。can は弱く「クン」に近い。',
      mean: 'no chance が否定を担うので、あとは肯定の can。否定は重ねない。',
      trap: '弱い can は can’t と似て聞こえる。can’t なら母音がはっきり長く、t で止まる。',
      use: 'No way I can eat all that.（あれを全部食べるなんて無理）' },

    // R fix: V2 (blind 80 %): "afraid of getting hurt" was weak; the new distractor uses the phone he asks for
    // why: call a doctor ← "I need an iPhone" heard as wanting to phone for help; never worked ← "chopping wood" + a
    //   splinter = a city boy
    { id: 'i4', skill: 'infer', level: 'B2', point: 'splinter', seg: [84, 93.6],
      stem: 'What does Tom’s reaction to the splinter show about him?',
      choices: ['Even a tiny problem sends him to the web', 'He wants a phone so he can call a doctor',
                'He has never done hard work with his hands'], a: 0,
      cue: '「splinter」のあと、何を欲しがるか。',
      line: 'it’s a splinter. *I need to get on WebMD now*. I need an iPhone…',
      said: 'とげが刺さっただけで「今すぐ医療サイトを見なきゃ、スマホが要る」と騒ぐ。',
      mean: '小さなけがでも、まずネットで調べようとする。画面への依存ぶりを示す場面。',
      trap: 'iPhone と聞くと電話で助けを呼ぶようだが、目的は WebMD で調べること。使い道を聞く。',
      use: 'Let me just look it up.（ちょっと調べてみる）' },

    // R fix: V2 (blind 70 %): "throw away every gadget" was the odd one out; all three are now ways of going through
    //   the list
    // why: write down ← "words" heard as a writing task; think ← "let the words just float away" heard as quiet
    //   meditation
    { id: 'd5', skill: 'detail', level: 'B2', point: 'idea', seg: [100.4, 111],
      stem: 'What does Ron’s new idea ask Tom to do?',
      choices: ['Talk through everything he does on screens', 'Write down everything he does on screens',
                'Think hard about everything he does on screens'], a: 0,
      cue: '「garbage」の文のあと、命令の動詞。',
      line: '*Talk about all the things you do on those screens* and let the words just float away',
      said: '「画面でしていることを全部話して、空気に流せ」と言う。',
      mean: 'purge ～ from your system ＝ 体から出し切る。話すことで依存を手放させる方法。',
      trap: 'words から書く作業や瞑想に思えるが、動詞は Talk。最初の動詞を聞く。',
      use: 'Just talk it out.（とにかく話して吐き出しなよ）' },

    // R fix: V2 (blind 55 %): "won't join in" was refuted by the whole second half; the new distractor is a neat
    //   admission. N7: the key gives r1's continuation, so it reveals `easy`
    // why: feels free ← "See, that was easy" and "worth a shot"; admits he's hooked ← the usual detox-scene ending
    { id: 'g2', skill: 'gist', level: 'B2', point: 'purge', reveals: ['idea', 'system', 'easy'], seg: [100.4, 190.3],
      stem: 'How does Ron’s “new idea” work out?',
      choices: ['Tom says so much that Ron has to stop him', 'Tom gets it all out and feels free of screens',
                'Tom lists his sites and admits he’s hooked'], a: 0,
      cue: '最後のロンの「No more」のあたり。',
      line: '*Okay, that’s enough. No more talking.*',
      said: 'トムは SNS、Reddit、チャット、ポッドキャストと話し続け、ロンが「もういい」と止める。',
      mean: '吐き出させる作戦は、出てくる量が多すぎて打ち切りに。依存の深さが分かる。',
      trap: '「簡単だったな」で解決したように聞こえるが、そのあとも話は延々と続く。',
      use: 'Okay, that’s enough for today.（よし、今日はここまで）' },

    // R fix: V2/K6 (blind 50 %): the key was the only hedged choice; "only if quick" became a second hedge
    // why: sure thing ← "shot" read as a hit (命中); going along ← "Okay" read as reluctant (日本語の「まあいいか」)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'shot', seg: [109.6, 112.6],
      stem: 'When Tom agrees to Ron’s idea, what does his reply mean?',
      choices: ['It may not work, but it’s worth a try', 'It sounds like a sure way to fix him',
                'It won’t help, but he’ll go along with Ron'], a: 0,
      cue: '「Okay」のあとの3語。',
      line: 'Okay, *worth a shot*.',
      said: '「よし、やってみる価値はある」と答える。',
      mean: 'worth a shot ＝ ダメもとでやってみる価値がある。期待しすぎない前向きな返事。',
      trap: 'shot を「命中」と取ると自信満々に聞こえる。worth は「価値がある」程度。',
      use: 'It’s worth a shot.（ダメもとでやってみよう）' },

    // predict: the segment stops after Ron's "See, that was easy"; `then` plays Tom carrying on
    // R fix: V2 (blind 55 %): "calls it a day" was a weak stop; the new one is the success script
    // why: feels better ← "See, that was easy" sounds like the cure worked; Ron's next step ← "And then we will be
    //   done" set a plan
    { id: 'r1', skill: 'predict', level: 'B2', point: 'easy', seg: [112.4, 122.6], then: [122.6, 131],
      stem: 'After Ron’s “See, that was easy”, what kind of move comes next?',
      choices: ['More of the same list from Tom', 'Tom says he feels better already', 'A new task from Ron for Tom'],
      a: 0,
      cue: 'Tom の最初の文の始め方を思い出して。',
      line: 'Every day, I *start by* hitting up Facebook… — See, that was easy. — *Then* I like to go on Reddit.',
      said: 'ロンが「ほら簡単」と締めるが、トムは「それから Reddit」と続ける。',
      mean: 'start by ～ は「まず〜から」。続きがある合図で、ロンの締めは早すぎる。',
      trap: 'See, that was easy は締めに聞こえる。話し手の最初の言い方で先を読む。',
      use: 'I usually start by checking email.（いつもまずメールを見る）' },

    // R fix: V2 (blind 50 %): "leaves it off… sometimes" read oddly; it's now "drops it"
    // why: drops ← "throw" = 捨てる; post updates ← LinkedIn is a work site, so "throw in" heard as putting
    //   something on it
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'throwin', seg: [114.3, 118.7],
      stem: 'What does Tom say he sometimes does with LinkedIn?',
      choices: ['Adds it to the sites he checks', 'Drops it from the sites he checks',
                'Posts updates about his work there'], a: 0,
      cue: '「Sometimes I like to」のあとの動詞。',
      line: 'Sometimes I like to *throw in* LinkedIn.',
      said: '「時々 LinkedIn も入れる」と、毎朝のサイト巡りに足している。',
      mean: 'throw in ＝ おまけに加える。リストに一つ足すときの軽い言い方。',
      trap: 'throw を「捨てる」と取ると逆の意味になる。in があれば「中に入れる」。',
      use: 'They threw in a free dessert.（デザートをおまけしてくれた）' },

    // R fix: V2 (blind 60 %): "a Brad from Pittsburgh" spelt out the pun; the key no longer names the city, and the
    //   impostor distractor now has the star posing as the teacher
    // why: never found out ← "brad.pitt" said first; posing ← "wasn't the actor… a teacher" heard in the wrong
    //   relation
    { id: 'h3', skill: 'humor', level: 'C1', point: 'brad', seg: [148.9, 160],
      stem: 'What is the joke in Tom’s Gchat story?',
      choices: ['He wasn’t the star, just a teacher named Brad', 'The star was posing as a teacher named Brad',
                'Tom never found out it wasn’t the star'], a: 0,
      cue: '「wasn’t the actor」のあと、どこの誰か。',
      line: 'I hit up brad.pitt. Wasn’t the actor. It’s actually *a guy named Brad* that’s a teacher *in Pittsburgh*.',
      said: '「brad.pitt は俳優でなく、ピッツバーグの教師ブラッドだった」と話す。',
      mean: 'pitt は名字でなく Pittsburgh の略。有名人風の名前の正体が笑い。',
      trap: 'brad.pitt で俳優を想像しやすい。actually のあとが本当の話。',
      use: 'Turns out it was someone else.（実は別人だった）' },

    // why: reviews places ← "rate" heard as reviewing restaurants; recipes ← "kinds of nachos" heard as cooking
    { id: 'd8', skill: 'detail', level: 'B1', point: 'podcast', seg: [178.4, 183.4],
      stem: 'What do Tom and his friend do on their podcast?',
      choices: ['Rate different kinds of nachos', 'Review places that sell nachos', 'Teach people how to make nachos'],
      a: 0,
      cue: '番組名のあと、「where we」に続く部分。',
      line: '…*where we rate different kinds of nachos*.',
      said: '友だちと「いろんなナチョスを採点する」ポッドキャストをやっていると言う。',
      mean: 'rate ＝ 点数をつける・評価する。番組の中身の説明。',
      trap: 'rate は「割合」や「料金」の意味もあるので戸惑いやすい。ここは「採点する」。',
      use: 'How would you rate it?（評価するとどれくらい？）' },

    // R drop: h4 (humor, nacho pun). V2 at 85 %: the choices name "average" and nachos, so "sounds like 'not your
    //   average'" is the only pun on offer, and no rewording hides it without the name. It also needed an ear check
    //   (whisper "Nacho Average", captions "Not Your Average"). Never shipped, so deleted.

    // C2: a plain-English paraphrase
    // anchor: 183.5–189.8 s "Okay, that's enough. No more talking." → "you told me to get it all out of my system" →
    //   "I had no idea how much you had in your system" (and 102.6 s "purge all of this garbage from your system")
    // R fix: C2 §3 (blind 60 %): the phone reading was absurd; the new near miss reads "in your system" as feelings
    //   kept in
    // why: worked well ← the line read as sincere praise of the method; bottled up ← "had in your system" heard as
    //   pent-up feelings (the therapy frame), not the sites he listed
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'system', seg: [183.3, 190.3],
      stem: 'Which plain-English version keeps what Ron means in his last line?',
      choices: ['“I didn’t know you were this hooked on screens.”', '“I didn’t know my idea would work this well.”',
                '“I didn’t know you’d kept this much bottled up.”'], a: 0,
      cue: '直前の「No more talking」と、system の意味。',
      line: 'you told me to get it all *out of my system*. — I had no idea *how much you had in your system*.',
      said: '「吐き出せって言ったじゃん」に、ロンは「そんなにため込んでいたとは」と返す。',
      mean: 'system は体や心の中。出てきた量が依存の深さを示す。ほめではなく、あきれ。',
      trap: '「うまくいった」と取ると、直前の「もう話すな」と合わない。system は purge の流れで聞く。',
      use: 'Glad I got that out of my system.（吐き出せてすっきりした）' },
  ]
};
