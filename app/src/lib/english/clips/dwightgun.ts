// “Dwight's Accidental Discharge - The Office US” (the official The Office channel, BEST OF SEASON 7): Dwight asks
// Jordan to collect office gossip about him, turns up with a holster and a gun, is talked into giving the gun up, and
// after it goes off near Andy's ear the office fusses, cashes in and plays it down while Andy goes to hospital.
// Segments from the captions, words from whisper (2026-11-16). Untested: 3–15 s (Dwight's remarks on Jordan's looks),
// 22–53 s (the holster montage, visual), 68–74 s (the "shirts" retort), 93.9 s (whose apology), 97–99 s, 117–119 s
// (unclear: "a perfect seat"/"perfect SE"), 149.9 s ("Firewall"), 151.4 s ("she"/"he must"), 154 s ("I think I"/"you
// should go"), 163–185 s (hospital, visual). Names misspelled in the captions (Joe = Jo, "Annie" = Andy) aren't tested.
// EAR CHECK: 162.7 s w1 — whisper puts "Thank you, Darryl" at ≈163 s; the captions put "darl" at 169.1 s; the key is
//   Darryl either way: confirm the name answers the "I'll take them" offer
// EAR CHECK: 82.2 s s1 d3 — "weren't": confirm the n of the negative is heard (both sources say "weren't")
// EAR CHECK: 87.3 s x1 — "make us call" linked (≈"meikəs"); both sources agree on the words
// REVIEW 2026-11-16: pass 7, fix 15, drop 0, new 0; ear checks 3
// Open: with the harder toggle on, play 3 misses its C2 in 7 of 20 seeds: each C2 shares a point with a gist (nt2 with
//   g1 via `end`, nt1 with g2 via `noise`), and the gist always comes first. A third C2 on another point would fix it.
import type { Clip } from '../types.ts';

export const dwightGun: Clip = {
  id: 'dwightgun', video: 'fLkzx9VPZEc', title: 'Dwight\'s Accidental Discharge', dur: 185, wpm: 135, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: her gossip ← he has just told her what people say about her, so more of that seems to follow; stop
    //   listening ← "things they don't want me to know" heard as a warning to stay out of it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'spy', seg: [14.95, 22.1],
      stem: 'What does Dwight ask Jordan to do?',
      choices: ['Find out what people say about him', 'Tell him more of what people say about her',
                'Stop listening to what people say'], a: 0,
      cue: 'I want you to のあと、about の次の語。',
      line: 'I want you to *find out what people are saying about me*',
      said: '「僕について皆が言っている事、知られたくない事を探ってほしい」と頼む。',
      mean: '彼女の陰口を伝えたのは前置き。本当の頼みは、自分の噂を集めてくる事。',
      trap: '彼女の噂の話が先に来るので、続きもそうだと思いやすい。I want you to のあとが頼み。',
      use: 'I want you to find out the price.（値段を調べてほしい）' },

    // why: keeps it hidden ← "put your cell phone in it instead" heard as a compromise; Jo settles it ← "call Jo"
    //   heard as the plan rather than a threat
    { id: 'g1', skill: 'gist', level: 'B1', point: 'end', reveals: ['fine', 'jo', 'makeus'], seg: [53.0, 91.5],
      stem: 'How does the argument over Dwight’s holster end?',
      choices: ['Dwight agrees to give up the gun', 'Dwight keeps the gun but hides it',
                'They decide to let Jo settle it'], a: 0,
      cue: '最後の「Okay」のあと、ドワイトの返事。',
      line: 'Dwight, *no gun*. Okay? … Okay, all right, *fine*.',
      said: '「銃はなし。ジョーを呼ばせないで」と迫られ、ドワイトは「分かった」と折れる。',
      mean: 'all right, fine はしぶしぶ受け入れる言い方。ここで銃を外すと同意した。',
      trap: 'call Jo はジョーに任せる話に聞こえる。実際は「呼ばせるな」という警告。',
      use: 'All right, fine. You win.（分かったよ、君の勝ち）' },

    // R fix: V2 (blind 55 %, right): "sidesteps" made the key the only nuanced choice. All three now report what the
    //   answer says, in one plain form; "empty" is a keyword trap from 67 s.
    // why: where he got the gun ← "gift" and "great-uncle" heard as where the gun came from; holster is empty ← "an
    //   empty holster" comes up a few lines later
    { id: 'r1', skill: 'pragma', level: 'C1', point: 'dodge', seg: [53.0, 61.25],
      stem: 'When Dwight is asked if he’s carrying a gun, what does his answer do?',
      choices: ['It talks about the holster instead', 'It tells where he got the gun',
                'It says the holster is empty'], a: 0,
      cue: '質問は gun、返事の主語は何か。',
      line: '*The holster* was a gift from my great-uncle Honk.',
      said: '「銃を持ってる？」に「ホルスターは大おじの贈り物」と答える。',
      mean: '銃を聞かれたのにホルスターの話にすりかえ、認めも否定もせずにかわしている。',
      trap: 'gift が聞こえると銃のもらい先に聞こえる。返事の主語が質問とずれたら、はぐらかしを疑う。',
      use: 'That’s not really what I asked.（それ、聞いたことと違うよね）' },

    // R fix: V2 (blind 65 %, right): the key was the longest and the only "turns it around". Three short choices of
    //   one form now; the uncle distractor becomes blame (the gift, said just before).
    // why: uncomfortable too ← "uncomfortable" is said, but by the coworker; blames his uncle ← the great-uncle's
    //   gift, said just before
    { id: 'h1', skill: 'humor', level: 'C1', point: 'accessory', seg: [61.1, 68.6],
      stem: 'Why is Dwight’s reply about the gun and the holster funny?',
      choices: ['He reverses which one is the add-on', 'He agrees guns are uncomfortable too',
                'He blames his uncle for the holster'], a: 0,
      cue: 'accessory のあと、何の付属品と言うか。',
      line: 'The gun is just *an accessory to the holster*. … I can’t walk around wearing an *empty holster*.',
      said: '「銃はホルスターの付属品にすぎない。空のホルスターで歩けない」と言う。',
      mean: '普通はホルスターが銃の付属品。それを逆にして、銃を持つ言い訳にしている。',
      trap: '「不快」は相手の言葉で、ドワイトの気持ちではない。A to B の向きが普通と逆なら笑いどころ。',
      use: 'It’s just an accessory.（ただのおまけだよ）' },

    // why: greets someone ← hello as a greeting; answers his phone ← "cell phone" just before, and hello as the
    //   first word on a call
    { id: 'r2', skill: 'pragma', level: 'B2', point: 'hello', seg: [73.6, 78.1],
      stem: 'How does Dwight answer the cell phone idea?',
      choices: ['He brushes it off as plainly silly', 'He greets someone who just came in',
                'He answers his phone to try it out'], a: 0,
      cue: 'cell phone の提案のすぐあと、短い一語。',
      line: 'You could put your cell phone in it instead. — Uh, *hello?*',
      said: '「代わりに携帯を入れたら？」と言われ、「はぁ？」と返す。',
      mean: 'この Hello? は「正気？」「分かりきってるでしょ」の意味。挨拶でも電話でもない。',
      trap: 'hello を挨拶や電話の第一声と覚えていると取りにくい。上がり調子なら常識を疑う合図。',
      use: 'Hello? It’s raining. Take an umbrella.（ちょっと、雨だよ。傘持って）' },

    // R fix: S3: the cue held "later", a word only the key's reason has; it now says "two times" in Japanese. Blind
    //   55 %, but only through s1's stem, and s1 shares this point, so the choices stand.
    // why: hungry now ← "weren't" heard as "were"; looks like a gun ← the obvious visual joke, which nobody says
    { id: 'd3', skill: 'detail', level: 'B2', point: 'banana', reveals: ['weren'], seg: [78.1, 85.3],
      stem: 'Why does the coworker suggest a banana for the holster?',
      choices: ['Dwight might want a snack later', 'Dwight is hungry at this moment', 'A banana looks a bit like a gun'],
      a: 0,
      cue: 'in case のあと、2つの時の対比。',
      line: 'in case you *weren’t hungry now but you got hungry later*',
      said: '「今は空いてなくても、あとで空いたときのために」と理由を言う。',
      mean: 'in case ＝ 〜に備えて。あとで食べる用という提案。',
      trap: 'weren’t の t が消えると were に聞こえる。now と later の対比で確かめる。',
      use: 'Take a jacket in case it gets cold.（寒くなるといけないから上着を）' },

    // R fix: V2 (blind 60 %, right): "Everyone" was a filler. Now a mirror pair (Dwight mocked vs the coworker
    //   mocked) and the people who made him give up the gun. S4: the segment ran 15.5 s; it's 78.45–93.45 s.
    //   C5: `fine` left `reveals`. Nothing here shows a1's reluctance, and it cut the play-3 C2 misses from 13 to 7.
    // why: mocking the coworker ← "get me a banana" heard as a sarcastic jab; the others ← they just forced "no gun"
    //   on him, so the last line sounds aimed at them
    // anchor: 79.8 s "Why would I put a banana in my holster?" against 92.0 s "Someone get me a banana": he scoffs,
    //   then takes the idea, having said at 66.4 s he can't wear an empty holster
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'getbanana', reveals: ['end'], seg: [78.45, 93.45], retired: true,
      stem: 'When Dwight finally asks for a banana, who is the joke on?',
      choices: ['Dwight, for taking up the idea he just mocked', 'The coworker, for an idea he is now mocking',
                'The others, for making him give up the gun'], a: 0,
      cue: '最初はバナナをどう言っていたか。',
      line: 'Why would I put a banana in my holster? … Someone *get me a banana*.',
      said: 'バナナ案に「なんでホルスターにバナナを」と呆れていたのに、最後は「誰かバナナ持ってきて」と言う。',
      mean: '空のホルスターでは歩けない本人が、ばかにした案に結局乗る。笑われているのはドワイト自身。',
      trap: '最後の一言は同僚へのあてつけに聞こえやすい。前に否定した事を後で自分から頼むと、本人が笑いの的。',
      use: 'Okay, I take it back.（分かった、さっきのは取り消す）' },

    // why: were ← the t of weren't drops and the n is weak; aren't ← the right negative, the wrong tense
    { id: 's1', skill: 'sound', level: 'B2', point: 'weren', reveals: ['banana'], seg: [81.2, 85.3],
      stem: 'Fill the gap: “in case you ___ hungry now…”',
      choices: ['weren’t', 'were', 'aren’t'], a: 0,
      cue: 'you のあと、弱く短い一語。最後の音に注意。',
      line: 'in case you *weren’t* hungry now but you got hungry later',
      said: '「今は空いてなくても」。weren’t は t がほぼ消える。',
      mean: 'were＋not で n の鼻音が残る。later との対比で「今は空いていない」。',
      trap: '語尾の t が消えると were に聞こえやすい。n が残るかと、後の対比で判断する。',
      use: 'In case you weren’t told, we moved.（聞いてないかもだけど、引っ越したよ）' },

    // R fix: V2 (blind 65 %, right): "has to answer to" was the only choice about power. Each choice is now a role
    //   Jo could play in a gun row; only the threat's form settles it.
    // why: takes the gun ← a gun is the topic, so someone who handles guns fits; backs Dwight up ← "call Jo" heard as
    //   calling in Dwight's side
    { id: 'i1', skill: 'infer', level: 'B2', point: 'jo', reveals: ['makeus'], seg: [85.1, 88.6],
      stem: 'From the warning at the end, who is Jo most likely?',
      choices: [`Someone Dwight must take orders from`, 'Someone who could take the gun off him',
                'Someone likely to back Dwight up'], a: 0,
      cue: 'no gun のあと、脅しの一言。',
      line: 'Dwight, no gun. Okay? *Don’t make us call Jo*.',
      said: '「ドワイト、銃はダメ。ジョーに連絡させないで」と迫る。',
      mean: '名前を出すだけで脅しになるので、ジョーはドワイトより上の人物だと分かる。',
      trap: '銃の話の最中なので、銃を扱える人に聞こえやすい。名前で脅すときは、その人に力がある。',
      use: 'Don’t make me call your mom.（お母さんに電話させないでね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'makeus', seg: [85.1, 88.6],
      stem: 'Type the warning: “Don’t ___ Jo.” (3 words)', answer: 'make us call',
      cue: 'Don’t のあと、つながる3語。',
      line: 'Don’t *make us call* Jo.',
      said: '「ジョーに電話させないで」。make us が「メイカス」に近い。',
      mean: 'make＋人＋動詞 ＝ 〜に…させる。電話させる事をするな、という意味。',
      trap: 'us が弱く、make a や make it に聞こえやすい。make の後ろは人＋動詞を予想する。',
      use: 'Don’t make me ask you twice.（2回言わせないで）' },

    // R fix: V2 (blind 55 %, right): the key was the only two-part, hedged choice. Now three of one shape: giving in
    //   unhappily, giving in gladly, not giving in.
    // why: glad ← giving in can sound like relief; stalling ← "Okay… all right" heard as buying time, and "calm down"
    //   as pushing back
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'fine', reveals: ['end'], seg: [85.1, 91.6],
      stem: 'How does Dwight sound when he answers the “no gun” demand?',
      choices: ['Giving in, and not happy about it', 'Giving in, and glad it’s over', 'Not giving in, just stalling'],
      a: 0,
      cue: 'Okay のあとに重なる短い返事。',
      line: 'Okay, all right, *fine*. Everyone calm down.',
      said: '「分かった、分かったよ、いいよ。みんな落ち着け」。',
      mean: 'okay, all right, fine と重ねるのは、しぶしぶ折れる言い方。',
      trap: 'calm down は本人の落ち着きでも反撃でもなく、周りへの言葉。fine で終わる返事は不満つきの了承。',
      use: 'Fine. Have it your way.（いいよ、好きにして）' },

    // R fix: V2 + K1 (blind 65 %, right): "the floor is badly built" was defensible from “Why would they do that?”,
    //   and the key added footsteps nobody mentions. The choices are now about what the floor explains; the cue no
    //   longer holds "loud", the key's word.
    // why: a waste to hide ← "Why would they do that?" heard as regret over covering a nice floor; the bullet ← the
    //   later "a hole was seen" pulled forward to the floor
    { id: 'i2', skill: 'infer', level: 'C1', point: 'loud', seg: [99.0, 110.1],
      stem: 'Why does the speaker bring up the floor under the carpet?',
      choices: ['It’s why everything sounds so loud', 'It’s a waste to hide a nice floor',
                'It’s where the bullet ended up'], a: 0,
      cue: '最初のひと言と、床の話のつながり。',
      line: 'it’s *so loud*. … there is a hardwood floor underneath this carpeting',
      said: '「すごくうるさい。カーペットの下は板の床だ」と言う。',
      mean: '耳がおかしくなり、何もかも響いて聞こえるので、下が板の床のせいだと思っている。',
      trap: 'Why would they do that? は「もったいない」に聞こえる。so loud が出発点。',
      use: 'Why is it so loud in here?（ここ、なんでこんなにうるさいの）' },

    // R fix: V2 (blind 60 %, right): after a shot, "ringing that won't stop" was the only fitting choice. All three
    //   now end alike, and the phone distractor keeps the word "ringing".
    // why: a phone ← "ringing" as a phone's ring; pounding ← a loud inner sound after a shock (heart or head)
    { id: 'd4', skill: 'detail', level: 'B1', point: 'ring', seg: [110.1, 115.0],
      stem: 'In the talk to camera, what sound does the speaker describe?',
      choices: ['A ringing sound that won’t stop', 'A phone that won’t stop ringing', 'A pounding sound that won’t stop'],
      a: 0,
      cue: 'crazy のあとの語と、そのあとの2語。',
      line: 'there’s like this crazy *ringing going on*',
      said: '「なんか、すごいキーンという音が鳴りっぱなし」と言う。',
      mean: 'ringing ＝ 耳鳴り。大きな音のあとで耳がキーンとなる状態。going on は続いている事。',
      trap: 'ring から電話の着信を思い浮かべやすい。誰かの電話でなく、自分の耳の中の音の話。',
      use: 'My ears are still ringing.（まだ耳がキーンとしてる）' },

    // R fix: V2 (blind 60 %, right): "no shot touched" spelled out the joke, and the Dwight distractor was weak. The
    //   choices are now three readings of "I lost…", one form each.
    // why: really lost ← "I lost" taken at face value; hope to buy ← a list of pricey things heard as a wish list
    { id: 'h3', skill: 'humor', level: 'C1', point: 'insurance', seg: [117.6, 124.5],
      stem: 'What makes one coworker’s list for the insurance funny?',
      choices: ['They’re using the shot to cash in', 'They really lost them while running',
                'They’re naming what they hope to buy'], a: 0,
      cue: 'insurance のあと、並べる物の種類。',
      line: 'make a list of what’s lost for the insurance. — I lost *a necklace, a ring, a painting*',
      said: '「保険用に、なくなった物を」と言われ、「ネックレス、指輪、絵画」と並べる。',
      mean: '1発の暴発で高価な物ばかり無くなるはずがない。保険を口実に得をしようとしている。',
      trap: '「なくした」を事実と取ると、騒ぎで落とした話に聞こえる。並ぶ物が状況に合うか考える。',
      use: 'Does insurance cover this?（これ、保険はききますか）' },

    // R fix: V2 (blind 70 %, right): the key was the only detailed, three-part choice. Now three of one shape. "Calm:
    //   people play down what happened" is the near miss from the "loud noise" account.
    // why: pull together ← the hospital and WebMD talk sound like everyone helping; play it down ← the "all we know is
    //   that a gun fired" account, taken as the whole office's mood
    { id: 'g2', skill: 'gist', level: 'B2', point: 'after', reveals: ['insurance', 'spree', 'noise', 'webmd'],
      seg: [117.6, 163.4],
      stem: 'What is the mood in the office after the shot?',
      choices: ['Messy: most people look out for themselves', 'Tense: people pull together to help Andy',
                'Calm: people play down what happened'], a: 0,
      cue: '保険、何があったかの説明、病院の話。',
      said: '物を並べる人、「乱射」と騒ぐ人、「音がしただけ」と言い張る人、症状を調べる人がいる。',
      mean: '心配より、それぞれが自分の都合で動く混乱した場面。真剣に助ける空気は薄い。',
      trap: '病院やWebMDの話から、皆で助けていると思いやすい。保険のリストや言い訳が中心。',
      use: 'It’s total chaos in here.（ここ、大混乱だよ）' },

    // why: one shot ← what really happened; for fun ← "spree" from “shopping spree”, a fun splurge
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'spree', seg: [124.45, 128.55],
      stem: 'How does one worker describe what Dwight did?',
      choices: ['He shot at people again and again', 'He fired a single shot by accident', 'He went out shooting for fun'],
      a: 0,
      cue: 'went on a のあと、2語のまとまり。',
      line: 'Dwight went on a *shooting spree*',
      said: '「何があった？」に「ドワイトが乱射して頭を撃った」と答える。',
      mean: 'shooting spree ＝ 撃ちまくる事。ニュースの言葉で、大げさな説明。',
      trap: 'shopping spree（買い物三昧）から「楽しむ」を連想しやすい。spree は「しまくる」。',
      use: 'I went on a shopping spree.（買い物しまくった）' },

    // R fix: V2 + S2 (blind 50 %, right): "No, that's not true" in the stem made "a correction" the obvious pick. All
    //   three choices now fit "not true"; they differ in what the correction does to "a gun fired".
    // why: backs it up ← the Japanese 「実際」, a word that adds support; agrees after all ← "actually" read as taking
    //   back the "No", a self-correction toward yes
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['noise'], seg: [128.5, 136.6],
      stem: 'In the reply to “that’s all we know”, what does “actually” do?',
      choices: ['It goes further: even “a gun fired” is too much', 'It backs up the claim that a gun fired',
                'It takes back the “No” and agrees after all'], a: 0,
      cue: 'not true のすぐあと、その次の文の中身。',
      line: 'No, that’s not true, *actually*. We heard a loud noise.',
      said: '「銃が発射された、それだけ」のあと「いや、それも違う」と言い直す。',
      mean: 'actually は訂正の合図。「銃が発射された」さえ認めず、さらに弱めている。',
      trap: '日本語の「実際」は裏付けに近いが、英語の actually は「実は違って」にも使う。',
      use: 'Actually, I changed my mind.（実は、気が変わった）' },

    // R fix: V2 + K1 (blind 60 %, right): "what is left unsaid" has many answers (that Andy was hurt, for one). The
    //   stem now asks what the account avoids saying. "A witness" becomes a keyword trap: "no one saw…" is said
    //   outright, so it isn't withheld.
    // why: no one saw ← the last sentence, said aloud, heard as the hidden point; Andy fired ← the shot hit near Andy,
    //   so he's in the frame (right mechanism, wrong person)
    // anchor: 132.0–137.7 s "that's not true actually… a hole was seen… no one saw the bullet leave the gun": each step
    //   cuts the link between Dwight's gun and the shot, which no one else in the clip doubts
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'noise', seg: [128.5, 140.5], retired: true,
      stem: 'In the account of “a loud noise” and “a hole”, what is it avoiding saying?',
      choices: ['That Dwight’s gun was what fired', 'That no one saw the bullet leave',
                'That Andy fired the gun himself'], a: 0,
      cue: '主語のない言い方と、最後の一文。',
      line: 'We heard a loud noise. Later, *a hole was seen*. No one saw the bullet leave the gun.',
      said: '「大きな音がした。あとで穴が見つかった。弾が出るのは誰も見ていない」と並べる。',
      mean: '受け身で主語を消し、事実を細かく切り分ける言い逃れ。避けているのは、ドワイトの銃が撃ったという事。',
      trap: '「誰も見ていない」ははっきり言っているので、隠し事ではない。受け身が続いたら、消えた主語を探す。',
      use: 'Mistakes were made, okay?（ミスはあったってこと）' },

    // R fix: V2 (blind 55 %, right): "too scared to think" was a filler. Three labelled readings now; the warning
    //   reading ("WebMD will scare Andy") is a real one for this site.
    // why: thanks ← Oscar has just offered to look it up; warning ← WebMD's name for scary results, and "Something's
    //   definitely wrong" sets a worried mood
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'webmd', seg: [142.5, 149.5],
      stem: 'How does the coworker mean the remark about Oscar finding a reason?',
      choices: ['Teasing: Oscar loves an excuse for WebMD', 'Thanking: Oscar is quick to help out',
                'Warning: WebMD will only scare Andy more'], a: 0,
      cue: '「みんな」と呼びかけたあとの言い方。',
      line: 'Oh, everybody, Oscar *found a reason* to look on WebMD.',
      said: '「みんな、オスカーがWebMDを見る口実を見つけた」。',
      mean: 'found a reason to 〜 ＝ 〜する口実を見つけた。好きな事をからかっている。',
      trap: '調べ始めた直後なので感謝に聞こえる。found a reason は「やりたい事」の合図。',
      use: 'Any reason to eat cake, right?（ケーキを食べる口実なら何でもね）' },

    // why: phone off ← the usual reason a call fails; a meeting ← a boss's usual reason to be out of reach
    { id: 'd5', skill: 'detail', level: 'B1', point: 'plane', seg: [149.45, 155.2],
      stem: 'Why can’t the caller get through to Jo?',
      choices: ['Jo is probably on a flight already', 'Jo’s phone seems to be switched off',
                'Jo is stuck in a long meeting'], a: 0,
      cue: 'reach Jo のあと、must の文。',
      line: 'I can’t reach Jo. … must *already be on the plane*.',
      said: '「ジョーに連絡がつかない。もう飛行機に乗ってるはず」と言う。',
      mean: 'must be 〜 ＝ きっと〜だ、という推測。連絡がつかない理由を言っている。',
      trap: '連絡がつかないと聞くと、電源オフや会議を思い浮かべやすい。must のあとに推測の理由が来る。',
      use: 'She must already be at the airport.（もう空港に着いてるはず）' },

    // R fix: V2 (blind 55 %, right): the key was the only refusal and the only one with a reason. Two refusals with
    //   different reasons now, and a near-sound yes (shouldn't → should).
    // why: says yes ← the -n't of "shouldn't" lost, so "should be without" flips; until Jo is reached ← "I can't
    //   reach Jo" just before, heard as the reason to wait
    { id: 'r4', skill: 'pragma', level: 'B2', point: 'reception', seg: [154.0, 161.15],
      stem: 'What does the reply to “I’ll go with you” do?',
      choices: ['Says no: the receptionist must stay put', 'Says yes: the receptionist should go too',
                'Says no: nobody leaves until Jo is reached'], a: 0,
      cue: 'No のあと、理由の部分。',
      line: 'No, we really *shouldn’t be without a receptionist*, now more than ever.',
      said: '「一緒に行く」に「だめ、受付がいないと困る。今こそ」と返す。',
      mean: '仕事の理由で断っている。now more than ever は大げさ。',
      trap: 'shouldn’t の t が消えると should に聞こえ、同意になる。最初の No を聞く。',
      use: 'Thanks, but I really shouldn’t leave now.（ありがとう、でも今は離れられない）' },

    // R fix: S4: the segment ran 16.0 s; it now starts at 156.4 s, just before the "No" that turns the receptionist
    //   down, and still runs to 170.0 s to cover both sources' "Darryl" (163 s and 169 s).
    // why: the receptionist ← she offers first, but that offer is turned down; Oscar ← he is the one checking WebMD
    { id: 'w1', skill: 'who', level: 'B1', point: 'darryl', reveals: ['reception'], seg: [156.4, 170.0],
      stem: 'Who ends up taking the injured man to the hospital?',
      choices: ['Darryl', 'Oscar', 'The receptionist'], a: 0,
      cue: '断られたあと、別の人の申し出とお礼。',
      line: 'I’ll take them. — Thank you, *Darryl*.',
      said: '受付の申し出が断られたあと、別の人が「僕が連れて行く」と言い、「ありがとう、ダリル」と返される。',
      mean: 'お礼のあとの名前で、誰が申し出たか分かる。take ＝ 人を連れて行く。',
      trap: '最初に申し出た人を選びやすいが、それは断られた。お礼の相手の名前を聞く。',
      use: 'I’ll take you to the station.（駅まで送るよ）' },
  ]
};
