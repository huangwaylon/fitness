// REVIEW 2026-11-16: pass 8, fix 14, drop 0, new 0; ear checks 1
// Open: nt1 still hangs on the 195.4 s speaker (ear check below). If the user hears Ron there, drop nt1.
// “Tom proving Ron is the most patient man on Earth | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): banned from screens for a week, Tom gets lost driving to work and falls apart, so Ron takes him to his
// cabin; there Tom's "purge" turns into a long tour of his online life, then a quick confession and an exit plan.
// Segments from the captions, words from whisper (2026-11-16). The captions run ≈ 0.3–0.7 s ahead of whisper, and miss
// 30–36 s (whisper: "When you check your email, you go to AltaVista…"). Talk ends at ≈ 231 s; whisper's 247 s "you" is
// noise. Speakers are settled by "Ron" (46.9, 67.6, 220.3 s), "Jerry" (43–44 s), "Tom" (191.6 s) and by sense (the
// man without screens is Tom). Untested on purpose: the opening greeting (captions "Lauren James", whisper "LaRon
// James"), 55.4 s "This is the work of a lunatic" (what it's about is on screen), 82.7 s "Paul Bunyan" (world
// knowledge), 131–146 s (the Ray J stretch, with a sex-tape line), 160–175 s (the emoji bit, with "racist"), 205.4 s
// (captions "I've heard", whisper "I've hurt"), 124.9 s (captions "because", whisper "'cause").
// EAR CHECK: 195.4 s nt1 — "I've downloaded every episode of Intervention. I know what to do here." is assumed Tom's
//   (to camera, between Ron's "you need to change" and Tom's "You're right"); if it is Ron's, nt1 is dropped
import type { Clip } from '../types.ts';

export const ronPatience: Clip = {
  id: 'ronpatience', video: 'Bqfu0wox3-g', title: 'Tom proving Ron is the most patient man on Earth', dur: 250, wpm: 172,
  band: 'mid', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: an hour ← "an hour" caught and "and a half" lost; half an hour ← the same words, reordered; two and a half
    //   ← "a half" kept, the start missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'howlate', seg: [2.4, 6.0],
      stem: 'How late is Tom for work?',
      choices: ['Half an hour', 'An hour', 'An hour and a half', 'Two and a half hours'], a: 2, keep: true,
      cue: '「breakfast」の問いへの返事、時間の部分。',
      line: 'You are *an hour and a half late* for work.',
      said: '朝食の話をするトムに「1時間半の遅刻だ」と返す。',
      mean: 'an hour and a half ＝ 1時間半。and a half は前の数に半分を足す。',
      trap: 'an hour のあとの and a half は弱く短い。最初の語で決めず、最後まで聞く。',
      use: 'Sorry, I’m twenty minutes late.（20分遅れてすみません）' },

    // R fix: V2, blind 55 % (the only choice without the GPS working); now all three are drives in, two with the GPS.
    //   The stem was reworded too: "Why is Tom so late for work?" had a token Jaccard ≥ 0.8 with n1's stem
    // why: long way ← "GPS" heard and "can't" heard as can, so the GPS led him; breakfast ← the breakfast question just
    //   before, plus "until I saw something"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'lost', seg: [5.3, 12.0],
      stem: 'What does Tom say made him so late?',

      choices: ['He drove in circles until he saw a place he knew', 'He took the long way his GPS picked for him',
                'He stopped to have breakfast on the way in'], a: 0,
      cue: '「sorry」のあと、GPSの前の短い語。',
      line: 'I *can’t use my GPS*… I just *drove around in circles* until I saw something familiar.',
      said: 'GPSが使えず、見覚えのある所に出るまで回っていたと言う。',
      mean: 'drive around in circles ＝ 同じ所を回る。迷っていた。',
      trap: 'can’t の t はほぼ消え、can に聞こえやすい。GPSが使えたら迷わない、と筋で確かめる。',
      use: 'I got lost and drove around in circles.（迷ってぐるぐる回っちゃった）' },

    // why: 3 ← Ron's round number just before; 34 ← "three-four" run together heard as thirty-four; 4.3 ← the digits
    //   swapped
    { id: 'n2', skill: 'number', level: 'B1', point: 'miles', seg: [11.5, 17.2],
      stem: 'By Tom’s GPS, how far from work does he live?',
      choices: ['3 miles', '3.4 miles', '4.3 miles', '34 miles'], a: 1, keep: true,
      cue: 'ロンの言った距離への言い返し、最初の数字。',
      line: 'You live three miles from here. — *3.4*, according to my GPS…',
      said: '「3マイルだろ」に、「GPSでは3.4」と言い返す。',
      mean: '3.4 は three point four。細かく直すところに、GPS頼みが出る。',
      trap: 'point が弱いと thirty-four に聞こえやすい。間の小さな point を待つ。',
      use: 'It’s about 3.4 miles from here.（ここから約3.4マイルです）' },

    // why: huge problem ← "big deal" read literally (大ごと); a deal ← deal = 取引, as in "made a deal"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'bigdeal', seg: [16.0, 21.0],
      stem: 'When Tom mentions his week without screens, what does he say about it?',
      choices: ['That it’s no problem; he can cope', 'That it’s a really huge problem for him', 'That it’s a deal he agreed to'],
      a: 0,
      cue: '「for a week」のすぐあとの二語と、その次。',
      line: 'I can’t use screens for a week. *Big deal*, I’m adapting.',
      said: '「1週間、画面が使えない。だから何？慣れてきてる」と強がる。',
      mean: 'Big deal だけだと「それがどうした」。大したことない、と言い返す決まり文句。',
      trap: '文字通り「大ごと」と取りやすい。すぐあとの I’m adapting と合わせて向きを決める。',
      use: 'Big deal. I’ll survive.（それがどうした。なんとかなるよ）' },

    // why: would click ← could/would differ by one weak sound; could pick ← the /kl/ blurred; could kick ← the l lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'click', seg: [26.5, 29.5],
      stem: 'Fill the gap: “I really wish you ___ those.”',
      choices: ['could click', 'would click', 'could pick', 'could kick'], a: 0,
      cue: 'wish you のあと、弱い助動詞と短い動詞。',
      line: 'I really wish you *could click* those.',
      said: '手作りのボードに「これクリックできたらな」と言う。',
      mean: 'wish you could ＝ できたらいいのに。could は弱く「クッ」程度。',
      trap: 'cl の l は弱く、kick や pick に聞こえやすい。画面の話なので click。',
      use: 'I wish I could stay longer.（もっといられたらいいのに）' },

    // R fix: V2, blind 55 % (the only negative feeling); "sorry for him" is a second sympathetic-negative reading
    // why: impressed ← "how else would I do it?" heard as a fair point; sorry ← "you don't have… any bookmarks?" heard
    //   as gentle concern (the kind Japanese frame)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'jerry', reveals: ['bookmarks'], seg: [38.0, 46.0],
      stem: 'How does Tom feel about the way Jerry gets to his email?',
      choices: ['Appalled at how badly he uses it', 'Impressed that he gets there at all', 'Sorry that nobody ever showed him how'],
      a: 0,
      cue: '最後の「God, Jerry」に続く一文。',
      line: 'God, Jerry, *you don’t deserve the internet*.',
      said: 'ブックマークも知らないジェリーに、「お前にネットはもったいない」と言う。',
      mean: 'deserve ＝ 〜に値する。使い方がひどすぎて、あきれている。',
      trap: '質問を重ねるので「気の毒に」と心配していると取りやすい。最後の一文は見下す調子。',
      use: 'You deserve a break.（少し休んでいいよ）' },

    // C2: exact words in fast speech (cf. a1)
    // anchor: 41.0–42.4 s "Do you have any bookmarks?" then the two-word reply; both sources have "What's bookmarks?",
    //   not "What are bookmarks?"
    // R fix: S4, the segment ended ≈ 0.5 s after "bookmarks" began (whisper has the line to 43.7 s); now 43.6 s
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'bookmarks', seg: [40.9, 43.6],
      stem: 'Type Jerry’s reply: “___?” (2 words)', answer: 'what\'s bookmarks',
      cue: '「any bookmarks?」への返事。文法より音を。',
      line: 'Do you have any bookmarks? — *What’s bookmarks*?',
      said: '「ブックマークある？」に「ブックマークって何？」。複数形なのに what’s のまま。',
      mean: '語として知らないので、一つの名前のように what’s で聞く。知らなさがこの形に出ている。',
      trap: '習った文法に合わせて what are と書きたくなる。書き取りは、正しい文でなく聞こえた音を書く。',
      use: 'Sorry, what’s “carpool”?（すみません、カープールって何？）' },

    // R fix: V2, blind 70 % (fillers); now a literal "detox" reading and a "lunatic"-at-work reading
    // why: body ← "detox" taken as the katakana デトックス (a health cleanse) + "fresh air" later; stress ← "the work of
    //   a lunatic" and the office setting heard as Ron sending him off to rest
    { id: 'g1', skill: 'gist', level: 'B1', point: 'cabin', reveals: ['coping'], seg: [42.9, 72.4],
      stem: 'Why does Ron invite Tom to his cabin in the woods?',
      choices: ['To help him get through his week without screens', 'To give him a break from the stress of work',
                'To clean out his body with fresh air and rest'], a: 0,
      cue: '「I’m going crazy」から、ロンの返事まで。',
      line: 'Life without screens is pointless… — You need to *detox*.',
      said: 'トムが「画面のない生活は無意味」とこぼし、ロンが「デトックスが必要だ。明日、小屋へ行こう」と言う。',
      mean: 'detox ＝ 本来は体の毒抜き。ここでは画面から離れて過ごすこと。',
      trap: 'detox を体の毒抜きと取りやすいが、これは画面の悩みへの返事。',
      use: 'I need a digital detox.（デジタル断ちが必要だ）' },

    // R fix: V2, blind 55 % (the only "badly"); a second "badly" that the closing "though" refutes
    // why: fine ← "I made an iPhone" heard as a working fix, and "I'm adapting" said earlier; paper phone helps ←
    //   "I made an iPhone out of paper" caught, the "not the same though" after it lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'coping', reveals: ['bigdeal'], seg: [45.3, 51.6],
      stem: 'By what Tom tells Ron, how is his week without screens going?',
      choices: ['Badly; nothing he tries really helps', 'Fine; he’s found ways to cope with it',
                'Badly, though his paper phone helps a bit'], a: 0,
      cue: '「Ron」と呼んだあとの、三つの短い文。',
      line: 'I’m *going crazy*, Ron. Life without screens is *pointless*… It’s *not the same* though.',
      said: '「おかしくなりそう。画面なしは無意味。紙でiPhoneを作ったけど、同じじゃない」。',
      mean: '代わりの物を作っても役に立たない。強がりとは逆の本音。',
      trap: 'iPhone を作った話から工夫できていると取りやすいが、最後の though が打ち消している。',
      use: 'It’s not the same, though.（でも、やっぱり違うんだよね）' },

    // R fix: V2, blind 60 % (the only choice about connection); now two power readings that "not even aware" settles
    // why: hidden ← "not even aware there's a structure" heard as a secret place only Ron can find; power cuts ←
    //   "electric company" caught, taken as poor service rather than none
    { id: 'i2', skill: 'infer', level: 'C1', point: 'remote', seg: [57.5, 66.5],
      stem: 'What does Ron’s line about the electric company tell Tom?',
      choices: ['There’s no power out there at all', 'It’s hidden, so only Ron can find it',
                'The power out there often goes out'], a: 0,
      cue: '「so far away from」に続く例え。',
      line: 'It’s *so far away from civilization*, the electric company is not even aware there’s a structure there.',
      said: '「文明から遠すぎて、電力会社も建物があると知らない」と小屋を説明する。',
      mean: '電気も来ない＝画面は使えない。遠さを大げさに言っている。',
      trap: '電力会社から「停電が多い」と取りやすいが、建物を知らない＝電気が来ていない。例えは遠さを強める。',
      use: 'It’s in the middle of nowhere.（何もない所にあるんだ）' },

    // R fix: V2, blind 55 % (the car filler); now "too upset to drive", from “I'm going crazy” just before
    // why: cabin tonight ← "tomorrow… my cabin" just before, heard as going there now; upset ← "I'm going crazy" and
    //   "lunatic" just before, heard as the reason he shouldn't drive
    { id: 'd2', skill: 'detail', level: 'B1', point: 'ride', seg: [66.4, 72.8],
      stem: 'Why does Tom ask Ron for a ride after work?',
      choices: ['He can’t find his way home on his own', 'He wants to head to the cabin tonight',
                'He’s too upset to drive himself home'], a: 0,
      cue: '頼みのあとの「There’s no chance」。',
      line: '…a ride after work? There’s *no chance I can find my way home*.',
      said: 'お礼を言い、「仕事のあと送ってくれる？自力で家に帰れる気がしない」と頼む。',
      mean: 'no chance ＝ 見込みゼロ。GPSなしでは、近い自宅にも帰れない。',
      trap: '小屋へは「明日」と言っているので、今夜の話ではない。tomorrow など時の語を押さえる。',
      use: 'Could you give me a ride home?（家まで送ってもらえる？）' },

    // R fix: V2, blind 75 % (the only funny choice); now a funny phone reading that "WebMD… 4G" refutes
    // why: leave the woods ← "I need… now" heard as panic to get out; call a doctor ← "iPhone or a Samsung Galaxy"
    //   caught, "WebMD" and "4G" (going online) lost
    { id: 'h1', skill: 'humor', level: 'C1', point: 'splinter', seg: [84.2, 93.0],
      stem: 'Why is Tom’s reaction to the splinter funny?',
      choices: ['He makes a tiny injury his reason to go online', 'He suddenly wants to leave the woods for good',
                'He wants the newest phone just to call a doctor'], a: 0,
      cue: '「WebMD」のあと、ほしい物の並べ方。',
      line: 'it’s a *splinter*. I need to get on WebMD now. I need an *iPhone*… something with *4G*.',
      said: 'とげ一本で「今すぐWebMDを。4GのiPhoneかGalaxyを」と騒ぐ。',
      mean: '小さなけがを口実に画面へ戻ろうとし、機種や通信まで指定する。',
      trap: 'iPhone から「医者に電話」と取りやすいが、WebMD と 4G はネットの話。何を求めるかを聞く。',
      use: 'It’s just a scratch. Relax.（ただのかすり傷だよ。落ち着いて）' },

    // R fix: V2, blind 50 % (the delete filler); now "Ron calls it a success", from “See, that was easy” at 121 s
    // why: struggles ← "worth a shot" heard as reluctance; success ← "See, that was easy" taken as the end of it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'purge', reveals: ['easy'], seg: [101.0, 195.0],
      stem: 'How does Ron’s idea of talking it all out turn out?',
      choices: ['Tom happily goes on and on about his online life', 'Tom finds it hard to name more than a few sites',
                'Tom lists a few sites, and Ron calls it a success'], a: 0,
      cue: 'サイト名の数と、ロンの最後の反応。',
      line: 'I had *no idea how much* you had in your system.',
      said: 'トムは毎日見るサイトを楽しそうに次々と語り、ロンが「こんなにあるとは」と止める。',
      mean: '毒を出すはずが、好きな物の紹介になった。ロンの言葉が量の多さを示す。',
      trap: '「that was easy」で終わる話に聞こえるが、まだ続く。最後の反応で結果を確かめる。',
      use: 'I had no idea it was that big.（そんなに大きいとは知らなかった）' },

    // R fix: V2, blind 65 % (the only abstract choice); now two "built up inside him" choices that the screens settle
    // why: phone ← "system" read as a computer system (システム), and the talk is about screens; anger ← "purge" and
    //   "let the words float away" heard as venting, the "things you do on those screens" lost
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'system', seg: [101.0, 110.9],
      stem: 'In Ron’s new idea, what does Tom need to clear out?',
      choices: ['The screen habits built up inside him', 'The apps and files saved on his phone', 'The anger built up inside him at Ron'],
      a: 0,
      cue: '「purge」のあと、「from your」に続く語。',
      line: 'You need to *purge* all of this garbage *from your system*. Talk about all the things you do…',
      said: '「そのゴミを全部出せ。画面でやることを話して流せ」と言う。',
      mean: 'from your system ＝ 自分の中から。頭や習慣にたまった物を出し切る言い方。',
      trap: 'system を「システム＝機械」と取りやすい。話して出す、と続くので人の中の話。',
      use: 'Just get it out of your system.（全部吐き出しちゃいなよ）' },

    // R fix: S4, "shot" (112.1 s) had ≈ 0.6 s after its start; whisper runs the line to 113.0 s
    { id: 'x1', skill: 'dict', level: 'B1', point: 'shot', seg: [110.4, 113.0],
      stem: 'Type Tom’s reply to the idea: “Okay, ___.” (3 words)', answer: 'worth a shot',
      cue: '「be done」のあと、短い返事。',
      line: 'Okay, *worth a shot*.',
      said: '「まあ、やってみる価値はあるね」と引き受ける。',
      mean: 'worth a shot ＝ 試す価値はある。うまくいくかは分からないが、やってみるという返事。',
      trap: 'worth‿a がつながり「ワーサ」に聞こえる。shot の t は止まるだけで、ほぼ聞こえない。',
      use: 'It’s worth a shot.（やってみる価値はある）' },

    // why: look ← see read literally (見る); understand ← "see?" heard as "you see?", checking he follows
    // R fix: S4, "easy" (122.0 s) ended at the cut; whisper runs the line to 123.1 s
    { id: 'm1', skill: 'marker', level: 'B2', point: 'easy', seg: [118.4, 122.8],
      stem: 'When Ron cuts in after Tom’s first few websites, what does his first word do?',
      choices: ['Points out that his plan is working', 'Asks Tom to look at something', 'Checks that Tom understands what he means'],
      a: 0,
      cue: 'LinkedIn の話のあと、ロンの短い一言。',
      line: '*See*, that was easy.',
      said: 'トムがSNSを並べたところで、ロンが「ほらな、簡単だろ」と言う。',
      mean: '文頭の See ＝「ほらね」。自分の言ったとおりになった、と示すつなぎ言葉。',
      trap: '「見て」と取りやすいが、何も指していない。文頭で軽く言う see は「ほら」。',
      use: 'See? I told you it would work.（ほらね、うまくいくって言ったでしょ）' },

    // why: the actor ← "brad.pitt" heard as the star, "wasn't" lost; in common ← "a lot in common" is said, but after
    //   "don't"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'brad', seg: [146.3, 160.0],
      stem: 'Who is the Brad that Tom chats with on Gchat?',
      choices: ['A teacher named Brad, in Pittsburgh', 'The actor, whom Tom really reached', 'A man with a lot in common with Tom'],
      a: 0,
      cue: '「hit up」のあと、actor の前の短い語。',
      line: 'I hit up brad.pitt, *wasn’t the actor*. It’s actually a guy named Brad that’s a *teacher in Pittsburgh*.',
      said: '「brad.pitt は俳優ではなく、ピッツバーグの教師ブラッドだった」。',
      mean: 'pitt は Pittsburgh の一部。共通点はないが、よく話す仲。',
      trap: 'wasn’t は弱く速く、俳優本人と取りやすい。否定の小さな音と actually を待つ。',
      use: 'I hit him up on Instagram.（インスタで彼に連絡した）' },

    // why: sorry ← a reply right after being stopped heard as an apology (すみません frame); more time ← the reply heard
    //   as "let me finish"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'toldme', reveals: ['system'], seg: [183.2, 190.2],
      stem: 'When Ron stops him, what is Tom doing with his reply?',
      choices: ['Saying he only did what Ron asked', 'Saying sorry for talking so long', 'Asking Ron for a little more time'],
      a: 0,
      cue: '「No more talking」のあと、トムの返事の主語。',
      line: '…*you told me* to get it all out of my system.',
      said: '「もう話すな」と止められ、「全部出せって言ったのはそっちだろ」と返す。',
      mean: '相手の指示を持ち出して、自分は悪くないと言い返している。',
      trap: '止められた直後なので謝ると思いやすい。you told me は、責任を相手に返す言い方。',
      use: 'Hey, you told me to!（だって、そうしろって言ったじゃない）' },

    // C2: what follows a to-camera line (cf. a2)
    // R fix: V2, blind 60 % (the only choice naming TV); a second TV reading, sincere, wrong in direction only
    // why: change of heart ← "You're right. I am an addict" taken at face value (sincerity flip); TV taught him ←
    //   "every episode of Intervention" caught, "I know what to do here" (= I know the script) heard as insight
    // anchor: 195.4–200.8 s "every episode of Intervention… I know what to do here", then 202.2–210.4 s the set
    //   phrases ("I will accept this gift of rehabilitation"); 219–225 s the "breakthrough" ends with Ron's car
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'rehab', seg: [191.8, 210.8],
      stem: 'After “I know what to do here”, how should we hear Tom’s confession?',
      choices: ['As TV lines, said to get himself off the hook', 'As a real change of heart after Ron’s words',
                'As proof TV showed him he really has a problem'], a: 0,
      cue: '「every episode of」のあとと、告白の言葉づかい。',
      line: 'I’ve downloaded *every episode of Intervention*. I *know what to do here*. … You’re right. I am an addict.',
      said: '「その番組は全部見た。どうすればいいか分かる」のあと、「その通り、僕は依存症だ」と認める。',
      mean: '番組で覚えた型どおりの告白。「この贈り物を受け入れる」という大げさな決まり文句が演技の証。',
      trap: 'You’re right を素直な反省、番組を気づきと取りやすい。直前の一言が、あとを台本に変える。',


      use: 'Don’t worry, I know the drill.（大丈夫、いつもの流れは分かってる）' },

    // R fix: V2, blind 65 % (the "ready to talk" filler); now "tired of his talking", from Ron's "No more talking"
    // why: tired ← Ron cut Tom's long talk off at 184 s, and "let's stare at the fire in silence" heard as "stop
    //   talking"; unsure ← "but also a bit fearful" heard as doubt about Tom
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'feelings', reveals: ['verging'], seg: [210.5, 219.0],
      stem: 'How does Ron feel right after Tom’s confession?',
      choices: ['Glad for Tom, but uneasy with emotional talk', 'Glad for Tom, but tired of hearing him talk',
                'Pleased, but unsure that Tom really means it'], a: 0,

      cue: '「but also」のあとの理由と、次の提案。',
      line: 'I’m proud of you, but also a bit fearful that we’re verging on what I call *feelings territory*. So let’s *stare at the fire in silence*.',
      said: '「誇りに思う。でも気持ちの話になりそうで少し怖い。だから黙って火を見よう」と言う。',
      mean: 'ほめつつも、感情の話は苦手。黙って火を見る提案で、話を終わらせている。',
      trap: 'fearful を「疑い」と取りやすいが、怖いのは気持ちの話。but のあとに本音。',
      use: 'Let’s not get too emotional.（あまりしんみりしないでおこう）' },

    // why: already inside ← "territory" heard as a place they have entered; moving out ← verging heard as veering away
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'verging', seg: [210.5, 216.6],
      stem: 'Where does Ron say the two of them are, in relation to “feelings territory”?',
      choices: ['Getting close to it', 'Already well inside it', 'Moving back out of it'], a: 0,
      cue: '「we’re」のすぐあとの動詞。',
      line: 'we’re *verging on* what I call feelings territory.',
      said: '「感情の領域とでも呼ぶ所に、近づいている」と言う。',
      mean: 'verge on ＝ 〜に近づく、すれすれ。まだ入っていないが、入りそうで怖い。',
      trap: 'territory から「もう中にいる」と取りやすい。verging on は手前、境目にいる感じ。',
      use: 'That’s verging on rude.（それ、失礼すれすれだよ）' },

    // why: repeat ← "what do you say" heard as "what did you say" (d'you / did you); his wishes ← the literal reading,
    //   asking what Ron wants
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'whatdo', seg: [218.9, 226.5],
      stem: 'Right after his “breakthrough”, what is Tom doing with his next question?',
      choices: ['Suggesting a plan and asking Ron to agree', 'Asking Ron to repeat what he just said',
                'Asking Ron what he himself would like to do next'], a: 0,
      cue: '文頭の決まった問いかけと、そのあとの計画。',
      line: '*What do you say* you chop up some more wood, and *I’ll take your car*…',
      said: '「君は薪割り、僕は君の車でステーキを買ってくる、でどう？」と言う。',
      mean: 'What do you say + 文 ＝「〜するのはどう？」。提案して、同意を求める形。',
      trap: '文字通り「何と言う？」と取ると、意見を聞いているようだ。後ろに文が続けば提案。',
      use: 'What do you say we grab lunch?（お昼に行くのはどう？）' },
  ]
};
