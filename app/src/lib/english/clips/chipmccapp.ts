// “Never meet your heroes (or country singers) ft. Bo Burnham | Parks and Recreation” (the official Parks and
// Recreation channel, Season 6): Leslie books teen country star Chip McCapp for the Unity concert; when she and Andy meet
// him, he is sweet to fans and vile to his dad, backs out with a "previous engagement", and Leslie calls it off.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Leslie (23.0 s), Andy (13.0, 188.4 s),
// Chip (78.6, 95.9, 111.8, 137.4 s); his dad is "son"'s speaker (117.4, 146.6, 176.0 s). The first 55 s (flu season,
// Larry's tent, Chip's age, the "chipmunks", the song title) are also in 7DxKsVWI1EA, whose bank already asks them, so
// this bank asks only d1, f1, n1 there and spends the rest on the meeting (77–189 s). Left out on purpose: the sung
// lyrics (56–77 s), "It's my dad got such an idiot" / "That's my dad. That's such an idiot" (97 s: the sources
// disagree), "Pick him up, Skip" (122.6 s: who is addressed is unclear), the "dirty hicks" insult (152.4 s), the
// paintball gag (169–178 s: its point is on screen), and the "pee on my palms" exit (181–188 s: who says "That makes us
// sound like hicks" can't be settled from the words). "fly in and out" (157 s) is whisper's "flammy in"; d4 doesn't use
// the verb. Whisper's last lines (189 s on) are a loop of "Bye". Leslie is named as the speaker only where the words
// settle it (d1 answers "Leslie, I don't feel good"; g1's closer says "let's go, Andy"); other stems stay neutral.
// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 1
// OPEN: nt1 (who the ham joke is on) reads at about 75–80 % with the segment; keep or drop after a listen?
// OPEN: d3 takes "They do buy a lot of albums" as the dad's (it follows "Permission to speak, son?"); no name settles it.
// OPEN: g1, g2 and a1 still sit near 45 % blind for anyone who reads the title as "the star turns out awful".
// EAR CHECK: 141.5 s nt2 — both sources have “I gots to get”; confirm “gots” (not “got”) before it ships
import type { Clip } from '../types.ts';

export const chipMcCapp: Clip = {
  id: 'chipmccapp', video: 'xCe-R7PeLLY', title: 'Never meet your heroes (or country singers) ft. Bo Burnham',
  dur: 209, wpm: 177, band: 'fast',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — blind 80 %: "a venue" and "seats" weren't people, so "Guess who" wasn't needed. Now three people.
    // why: host ← "secured… for the Unity concert" heard as someone to run it; sponsor ← "secured" heard as money
    //   secured, and a concert needs backers
    { id: 'd1', skill: 'detail', level: 'B1', point: 'headline', seg: [29, 36.6],
      stem: 'What good news does Leslie announce about the Unity concert?',
      choices: ['She has booked the act who will top the bill', 'She has found a famous host to present it',
                'She has signed a big sponsor to pay for it'], a: 0,
      cue: '「Guess who」のあと、だれとして押さえたか。',
      line: 'Guess who I just secured as the *headliner* for the Unity concert?',
      said: '「コンサートの目玉に、だれを押さえたと思う？」と聞く。',
      mean: 'headliner ＝ いちばんの目玉の出演者。secure ＝ 出演を確保する。',
      trap: 'secured の相手が人なのは分かっても、役目を聞き逃しやすい。as the のあとの語が役目。',
      use: 'We secured a great speaker for the event.（イベントにすごい講演者を呼べた）' },

    // R fix: V2 + S1 — blind 60 %: "his place in Indiana" pointed at status, and "sweet songs" was a filler.
    // why: dating ← sweetheart = 恋人 (the katakana スイートハート); kind boy ← "he's a sweetheart" = a kind person, the
    //   possessive "Indiana's" missed
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'sweetheart', seg: [39.1, 44.1],
      stem: 'What does the line linking Chip and Indiana mean?',
      choices: ['Everyone in the state adores him', 'He is known as a kind, gentle boy',
                'He is dating a girl from the state'], a: 0,
      cue: '「He’s like Indiana’s」のあとの一語。',
      line: 'He’s like *Indiana’s sweetheart*.',
      said: '「インディアナのアイドルみたいな存在」と言っている。',
      mean: '〈場所〉’s sweetheart ＝ みんなに愛される人気者。恋人の意味ではない。',
      trap: '恋人や「優しい人」とも取れるが、地名＋’s が付くと「その土地の人気者」。',
      use: 'She’s the town’s sweetheart.（彼女は町の人気者だよ）' },

    // why: twelve / twenty ← the "tw-" start; "two million" said fast after "like" is easy to stretch
    { id: 'n1', skill: 'number', level: 'B1', point: 'hits', seg: [49.4, 55.9], keep: true,
      stem: 'Roughly how many YouTube hits does Chip’s latest song have?',
      choices: ['Two million', 'Twelve million', 'Twenty million'], a: 0,
      cue: '「has like」のあと。',
      line: 'has like *two million* hits on YouTube.',
      said: '最新曲はYouTubeで「200万回くらい」再生されている。',
      mean: 'like は数字の前で「〜くらい」。ざっくりした数だと示す。',
      trap: 'twelve や twenty も「トゥ」で始まる。two は短く、すぐ million が続く。',
      use: 'It has like a thousand reviews.（レビューが千件くらいあるよ）' },

    // R fix: V2 — blind 60 %: both distractors were happy endings, and the title says it goes badly. Now one
    //   distractor has Chip end it, so the item turns on who ends it.
    // why: same-day deal ← Chip's offer (157 s) heard as accepted; Chip ends it ← his earlier "Ah, no" (106 s) and his
    //   insults heard as the end
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['sameday'], seg: [77, 188.8],
      stem: 'How does the meeting with Chip end?',
      choices: ['Leslie calls the whole deal off herself', 'Chip agrees to a quick visit, same day',
                'Chip calls it off and sends them away'], a: 0,
      cue: '最後のひと言。だれが話を終わらせるか。',
      said: '交渉は続くが、Chip の態度に Leslie が「もう終わり。あなたは要らない」と席を立つ。',
      mean: '頼む側だった Leslie が、自分から断る形で終わる。',
      trap: 'Chip の「Ah, no」や暴言で、彼が断ったと思いやすい。最後の一言で決まる。',
      use: 'Thanks, but we’ll pass.（ありがたいけど、やめておきます）' },

    // R fix: V2 — blind 70 %: "shy with fans, kind to dad" was a filler. Now "until they ask him for a favor" (a star
    //   who turns cold when asked) is the second distractor.
    // why: cold once asked ← the "Ah, no" (106 s) comes right before the outburst at his dad; rude to fans ← the rudeness
    //   heard, the target missed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'twoface', reveals: ['fans'], seg: [77.3, 133.2],
      stem: 'What side of Chip do Leslie and Andy see when they meet him?',
      choices: ['Sweet to fans, but awful to his own dad', 'Sweet to fans, until they ask him a favor',
                'Rude to fans, but sweet to his own dad'], a: 0,
      cue: 'ファンへの言葉と、父への言葉を比べて。',
      said: 'ファンには「君たちこそスター」と優しく、父には昼食のことでどなり散らす。',
      mean: '表の顔と裏の顔の差。会ってみたら、思っていた人と違った。',
      trap: 'どなる場面が強いので、だれにでも冷たいと思いやすい。二人への断りは軽く、どなる相手は父��け。',
      use: 'He’s nice to customers but mean to staff.（客には優しいのに、店員には冷たい）' },

    // R fix: V2 — blind 50 %: with the title, the one cynical-but-friendly choice stood out. "Real modesty" becomes
    //   "warm words meant just for them", so two sincere readings face two cynical ones.
    // why: just for them ← "It's an honor to meet you" answered warmly, face to face; a dig ← "the real superstars"
    //   heard as mocking the fans
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'fans', reveals: ['cheese', 'paid'], seg: [82.4, 95.4],
      stem: 'Right after greeting his fans warmly, how should we take Chip’s kind words?',
      choices: ['As a stock line he gives every fan', 'As warm words meant just for them', 'As a quiet dig at fans like them'], a: 0,
      cue: 'ほめ言葉のすぐあと、声の向きが変わる一言。',
      line: 'It’s *always* nice to meet my amazing fans… You’re the real superstars. … *Cheese on top or no one gets paid.*',
      said: 'ファンに「本当のスターは君たちだ」と言った直後、昼食の命令をどなる。',
      mean: 'always が付いた決まり文句。次の一言で、優しさは表向きと分かる。',
      trap: 'blessed や superstars を本心と取りやすい。always と直後の口調で判断。',
      use: 'You’re too kind. Really.（ご親切に。本当に）' },

    // why: these ← the same "th" start with a short vowel; some of those / a few of those ← "of those" kept, the start lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'stacks', seg: [89, 92.1],
      stem: 'Fill the gap: “Can someone give me ___ lunch stacks?”',
      choices: ['one of those', 'one of these', 'some of those', 'a few of those'], a: 0,
      cue: '「give me」のすぐあと、3語。',
      line: 'Can someone give me *one of those* lunch stacks',
      said: '「だれか、あのランチスタックを1つちょうだい」。',
      mean: 'one of those が「ワナヴゾウズ」とつながる。of はほぼ「ア」。',
      trap: 'of が消えると one those に聞こえ、別の語を足したくなる。最後の母音「オウ」で those。',
      use: 'Can I try one of those?（それ、1つ試してもいい？）' },

    // why: ham ← "I want ham" comes later (116 s), the best-remembered demand; no cheese ← "cheese" heard, the rule missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cheese', seg: [89.5, 95.4],
      stem: 'When Chip first asks for lunch, what does he insist on?',
      choices: ['Cheese goes right on top', 'Ham goes in instead of turkey', 'No cheese goes in at all'], a: 0,
      cue: '「stack them for me」のあと。',
      line: '*Cheese on top* or no one gets paid.',
      said: '「チーズは一番上。じゃないとだれも給料なし」と言う。',
      mean: 'on top ＝ 一番上に。重ね方まで指定する、わがままな注文。',
      trap: 'ham はあとで出てくる不満。最初の注文で言うのは、チーズの位置。',
      use: 'Can I get the dressing on the side?（ドレッシングは別でもらえますか）' },

    // R fix: V2 — blind 60 %: the key was the only unkind choice. "Joking he'll pay" becomes "complaining about the last
    //   lunch" (from “this time”).
    // why: complaining ← "stack them for me this time" implies the last one was wrong; offer ← "gets paid" heard as a
    //   reward
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'paid', reveals: ['cheese'], seg: [89.5, 96.3],
      stem: 'What is Chip doing when he adds the bit about pay?',
      choices: ['Threatening his staff over a small thing', 'Complaining the last lunch was made wrong',
                'Offering money to whoever makes it best'], a: 0,
      cue: '注文の最後、or のあとに続く部分。',
      line: 'Cheese on top *or no one gets paid*.',
      said: '「チーズが上じゃなかったら、だれにも給料を払わない」と言う。',
      mean: '〜 or … ＝「〜しないと…だぞ」。小さなことで脅している。',
      trap: 'this time の不満や、paid を「お礼」と取りやすい。問われているのは or 以下。命令＋or は脅し。',
      use: 'Be on time, or we leave without you.（時間どおりに来て。でないと置いていくよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'talkto', seg: [99.5, 103.3],
      stem: 'Type the line: “We ___ about the Unity concert.” (5 words)', answer: 'wanted to talk to you',
      cue: '最初の We のあと、about の前まで。',
      line: 'We *wanted to talk to you* about the Unity concert',
      said: '「ユニティ・コンサートのことでお話ししたくて」と切り出す。',
      mean: 'wanted to が「ワニドゥ」、talk to you が「トーカチュ」とつながる。',
      trap: 'to が2回とも弱く、語数を少なく聞きやすい。5語あると思って聞き直す。',
      use: 'I wanted to talk to you about Friday.（金曜のことで話したくて）' },

    // R fix: V2 — blind 75 %: only the key had an excuse. All three are refusals now; they differ in the order and in
    //   whether the door stays open.
    // why: no at once ← the quick "Yeah" (105.5 s) missed; think it over ← "It's a bummer" heard as regret that leaves
    //   room to talk
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'yeahno', seg: [99.5, 110.3],
      stem: 'When asked “Can you do it?”, how does Chip answer?',
      choices: ['He starts to say yes, then turns it down', 'He turns it down at once, with no yes first',
                'He turns it down, then says he’ll think it over'], a: 0,
      cue: '最初の短い一語と、そのあとの言い直し。',
      line: '*Yeah.* … *Ah, no.* I’m sorry, I got a previous engagement. It’s a bummer.',
      said: '「うん」と言いかけて、「あ、いや。ごめん、先約があって。がっかりだね」と断る。',
      mean: '期待させてから落とす断り方。謝ってはいるが、軽い。',
      trap: '短い Yeah を聞き落とすと、すぐ断ったと思いやすい。bummer は話を閉じる一言。返事は最初の一語から。',
      use: 'Yeah, no, I can’t make it.（うん、いや、行けないや）' },

    // R fix: V2 — blind 90 %: "married that day" was a filler beside the stock excuse. Now "just got engaged" and "a
    //   bad show there before", each from one of the two words.
    // why: engaged ← エンゲージ = 婚約 (engagement ring); bad show before ← previous = 以前の, so "something before"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'engage', reveals: ['yeahno'], seg: [104.3, 109.6],
      stem: 'What reason does Chip give for saying no?',
      choices: ['He already has something else booked', 'He has just got engaged and needs a break',
                'He played a bad show there once before'], a: 0,
      cue: '「I’m sorry」のあと、got a に続く2語。',
      line: 'I’m sorry, I got a *previous engagement*.',
      said: '「ごめん、先約があるんだ」と言っている。',
      mean: 'previous engagement ＝ 先約。断るときの決まった言い方。',
      trap: 'engagement はカタカナで「婚約」だが、ここは「約束・予定」。previous は「先に入った」。',
      use: 'Sorry, I have a previous engagement.（すみません、先約がありまして）' },

    // why: forgot cheese ← "cheese" is the first thing his dad mentions, so the order seems wrong; joking ← the outburst
    //   heard as play-acting between father and son
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ham', reveals: ['cheese'], seg: [110.8, 119.3],
      stem: 'Why does the moment the lunch arrives get a laugh?',
      choices: ['His dad got the order right, and Chip still blows up', 'His dad forgot the cheese again, and Chip blows up',
                'Chip blows up as a joke, and his dad plays along'], a: 0,
      cue: '父の「Look at that」と、そのあとの一言。',
      line: 'Look at that. *The cheese is on top.* — *Of turkey!* … I want *ham*!',
      said: '父が「ほら、チーズが上だ」と出すと、「ターキーの上に！」「ハムがいい！」と怒る。',
      mean: '言われたとおりにしても、別の不満で怒る。わがままぶりの極み。',
      trap: 'チーズの話が続くので、また失敗したと思いやすい。父は注文どおりにしている。',
      use: 'Nothing’s ever good enough for him.（何をしても彼は満足しない）' },

    // why: misses mom ← "let mom be" heard as a wish to have her around; mom worse ← "then?" heard as a dare that she'd
    //   do no better
    { id: 'i2', skill: 'infer', level: 'C1', point: 'manager', seg: [116.9, 122.3],
      stem: 'After his dad’s apology about the ham, what is Chip really saying?',
      choices: ['His dad could lose his job as manager', 'He would like his mother to be around more',
                'His mother would do the job even worse'], a: 0,
      cue: '「maybe I should just」のあと、文の最後まで。',
      line: 'All right, well, maybe I should just *let mom be manager* then?',
      said: '「じゃあ、ママにマネージャーをやってもらおうかな？」と言う。',
      mean: '父はマネージャー。役目を母に移す＝父をクビにする、という脅し。',
      trap: '母が恋しい話に聞こえやすいが、manager がかぎ。then? は「それなら」の脅し。',
      use: 'Maybe I should find another plumber, then.（じゃあ別の業者に頼もうかな）' },

    // anchor: 126.4–130.2 s "it sucks that they didn't have ham, but you can't treat your dad like that": the scolding
    //   opens by granting Chip's complaint, so the speaker's own priorities are what's odd
    // why: on Chip ← the line criticizes Chip ("you can't treat your dad like that"), so the laugh seems aimed at him;
    //   on the dad ← "they didn't have ham" heard as blaming the dad for the order
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'ham', seg: [124.6, 130.4],
      stem: 'In the remark about the missing ham, who is the joke on?',
      choices: ['The speaker, who half agrees about the ham', 'Chip, for the fuss he made over a sandwich',
                'Chip’s dad, for not getting the order right'], a: 0,
      cue: '「but」の前に、まず何を認めているか。',
      line: 'I mean, *it sucks that they didn’t have ham*, but you can’t treat your dad like that.',
      said: '「ハムがなかったのはひどいけど、父親にあんな態度はだめだ」と言う。',
      mean: '叱る前に、ハムがなかったのは「ひどい」と認めてしまう。笑われているのは、ハムを本気で惜しむ話し手。',
      trap: 'but のあとの本題だけ聞くと、Chip を笑う言葉に聞こえる。but の前で何を認めたかも聞く。',
      use: 'It’s a shame they were out, but still.（売り切れはがっかりだけど、それでもね）' },

    // R fix: V2 — blind 50 %: "charmed" was weak next to "the worst". Now "sure he's having a bad day" (from “it sucks
    //   that they didn't have ham”), so the key isn't the only "but" choice.
    // why: bad day ← "it sucks that they didn't have ham" heard as an excuse for him; done ← "he's the worst" read as
    //   ready to walk
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'monster', seg: [124.6, 133.2],
      stem: 'When the visitors talk it over after lunch, where do they land?',
      choices: ['Disgusted, but still set on signing him', 'Shocked, but sure he’s just having a bad day',
                'Fed up, and ready to give up on him now'], a: 0,
      cue: '「I know」のあと、二つに分かれる文。',
      line: 'I know. *He’s a monster, but we need him.*',
      said: '「そう、ひどい子。でも必要なの」と言う。',
      mean: 'but のあとが本音。嫌でも、コンサートのためにあきらめない。',
      trap: 'monster だけ聞くと、もう見限ったように聞こえる。but のあとに結論が来る。',
      use: 'It’s pricey, but we need it.（高いけど、必要なんだ）' },

    // R fix: V2 — blind 65 %: "wait until he says" was weak. Now "get whatever he asks for, fast" (needs heard,
    //   anticipate missed).
    // why: fetch fast ← "needs" heard, "anticipate" missed, so "serve my needs"; moods ← "needs" heard as being needy
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'anticipate', seg: [132.9, 138],
      stem: 'What does Chip tell his dad his job is?',
      choices: ['Knowing what he wants before he asks', 'Getting him whatever he asks for, fast',
                'Putting up with his moods all day long'], a: 0,
      cue: '「not that hard」のあと、Just に続く部分。',
      line: 'Your job’s not that hard, okay? Just *anticipate my needs*.',
      said: '「簡単な仕事だろ。こっちの欲しいものを先読みしろ」と言う。',
      mean: 'anticipate ＝ 先回りして予想する。言われる前に用意しろ、という要求。',
      trap: 'needs から「言われたら持ってくる」と思いやすい。anticipate は「前もって」。',
      use: 'Good staff anticipate what guests need.（いいスタッフは客の要望を先読みする）' },

    // R fix: V2 + B1 — blind 85 %: the key was the only "nothing big" choice. Three concrete events now, each with its
    //   consequence. The stem shows he has an engagement, so it reveals yeahno too.
    // why: photo shoot ← "important" taken at face value, and a star has shoots; family event ← his dad is right there
    { id: 'i1', skill: 'infer', level: 'C1', point: 'haircut', reveals: ['engage', 'yeahno'], seg: [137.9, 143.6],
      stem: 'What does Chip’s reply show about his “important other engagement”?',
      choices: ['It’s a haircut, so it hardly matters', 'It’s a photo shoot, so it can’t move',
                'It’s a family event, so his dad must come'], a: 0,
      cue: '「engagement」のすぐあと、Yo で始まる返事。',
      line: 'that important other engagement. — Yo, I gots to get *that haircut*.',
      said: '「大事な先約があるのは知ってる」と言われ、「髪を切りに行かないと」と答える。',
      mean: '大事な先約の正体は散髪。断る理由がどれほど軽いかが分かる。',
      trap: 'important をそのまま信じやすい。中身を言わせると、中身の軽さが出る。',
      use: 'My big plans? Laundry.（大事な予定？洗濯だよ）' },

    // anchor: 141.1–142.2 s both sources have "I gots to get that haircut", four quick weak words that grammar would
    //   turn into "I've got to" or "I got to"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'haircut', seg: [140.2, 143.5],
      stem: 'Type what Chip says: “Yo, ___ that haircut.” (4 words)', answer: 'i gots to get',
      cue: '「Yo」のすぐあと。文法より、聞こえた音を。',
      line: 'Yo, *I gots to get* that haircut.',
      said: '「なあ、髪切りに行かなきゃ」と言う。gots の s まで、ひと続きに速く聞こえる。',
      mean: 'gots to は got to のくだけた形。わざと崩した言い方で、大物ぶった軽さが出る。',
      trap: '習った I’ve got to に直したくなる。書き取りは正しい文ではなく、言われた音を書く。',
      use: 'I gotta go, my mom’s calling.（行かなきゃ、ママから電話）' },

    // why: hometown ← "gateway to that whole region" heard as where he's from; waiting fans ← Leslie's "the entire region
    //   needs you" heard as the dad's reason
    { id: 'd3', skill: 'detail', level: 'B1', point: 'albums', seg: [143.4, 152.3],
      stem: 'What reason does Chip’s dad give for doing the concert?',
      choices: ['People around there buy lots of his albums', 'It is the area where Chip grew up as a kid',
                'Fans in that area have waited years for him'], a: 0,
      cue: '「gateway」のあと、They do で始まる文。',
      line: 'Pawnee is kind of the gateway to that whole region. *They do buy a lot of albums.*',
      said: '父が「パウニーはあの地域の入り口だ。アルバムもよく売れる」と言う。',
      mean: 'do buy の do は強調。「実際によく買ってくれる」と、商売の理由を出す。',
      trap: '直前の「地域が君を必要としている」と混ざりやすい。父の理由はお金。',
      use: 'They do sell great coffee here.（ここ、本当にコーヒーがおいしいんだよ）' },

    // R fix: V2 — blind 70 %: "polite in front of guests" was weak. Now "about to tell his son off" (a sarcastic
    //   "permission?" before a scolding); his calm sales pitch refutes it.
    // why: telling off ← "Permission to speak?" is often sarcastic before a scolding; teasing ← a father calling his
    //   son "son" in a mock-military phrase heard as a family joke
    { id: 'i3', skill: 'infer', level: 'C1', point: 'permission', seg: [145.2, 152.3],
      stem: 'What does the way Chip’s dad asks to join in show?',
      choices: ['His teenage son is the one in charge', 'He is about to tell his son off',
                'He is teasing his son with an army joke'], a: 0,
      cue: '父が話す前の、短い問いかけ。最後の一語。',
      line: '*Permission to speak, son?*',
      said: '父が息子に「話してもいいかな？」と許可を求めてから話す。',
      mean: '本来は部下が上官に言う言い方。親子の立場が逆になっている。',
      trap: '叱る前の皮肉にも聞こえるが、続くのは穏やかな売りこみ。だれに許可を求めているかがかぎ。',
      use: 'Mind if I say something?（ひとこと言ってもいい？）' },

    // R fix: V2 — blind 60 %: "send a video" was weak. Now "staying over if they pay for a hotel" (from “spend a
    //   night”).
    // why: shorter show ← "in and out" heard as a quick set; hotel ← "spend a night" heard, "wouldn't have to" missed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'sameday', seg: [156.1, 160.2],
      stem: 'What deal does Chip put forward instead?',
      choices: ['Coming and going on the same day', 'Playing a much shorter set than usual',
                'Staying over if they pay for a hotel'], a: 0,
      cue: '「What if we」のあと。so のあとの理由も。',
      line: 'in and out *same day* so I *wouldn’t have to spend a night*…',
      said: '「日帰りなら、そっちの町に泊まらなくて済む」と提案する。',
      mean: 'What if we ～? ＝「〜するのはどう？」。条件付きの提案。',
      trap: 'in and out や spend a night に引かれやすい。wouldn’t have to が要点。',
      use: 'What if we leave early and skip traffic?（早めに出て渋滞を避けるのはどう？）' },

    // R fix: V2 — blind 55 %: "move there and settle down" was close to the key's own idea. Now "bring his family
    //   along" (from "family").
    // why: nothing for kids ← "raise kids" heard as an admission about young people; bring family ← "family" heard as
    //   Chip's family, invited to come too
    { id: 'h3', skill: 'humor', level: 'C1', point: 'family', seg: [160, 169.4],
      stem: 'Why does the defense of Pawnee get a laugh?',
      choices: ['She sells a teen star on raising a family there', 'She admits the town has little for young people',
                'She offers to let him bring his family along'], a: 0,
      cue: '最後の「Plus」のあとと、Chip の返事。',
      line: '*Plus, it is an amazing place to raise kids and start a family.* — You think I care about that?',
      said: '「子育てや家庭を持つのに最高の町」と言い、Chip に「そんなこと気にすると思う？」と返される。',
      mean: '日帰りしたい10代のスターに、子育ての魅力を売りこむ的外れ。',
      trap: '町を守る言葉としては真っ当。笑いは、相手がだれかとのずれにある。',
      use: 'Great schools, if you have kids.（子どもがいるなら、学校がいいよ）' },

    // R fix: V2 — blind 70 %: the distractors (hurt, hopeful) were far from the scene. Now "angry but open to a deal"
    //   and "shocked but polite", both built on the closing "okay?".
    // why: open to a deal ← "okay?" at the end heard as an opening to talk more; polite ← "okay?" heard as a softener
    //   (日本語の「ね？」)
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'outcome', seg: [177.6, 181.2],
      stem: 'In the last answer to Chip, how does the speaker sound?',
      choices: ['Fed up, and done dealing with him', 'Angry, but still open to a deal', 'Shocked, but trying to stay polite'], a: 0,
      cue: '「You’re crazy」のあとの、短い一文。',
      line: 'You’re crazy. *This is over*, okay? Pawnee does not need you.',
      said: '「どうかしてる。これで終わり。パウニーにあなたは要らない」と言う。',
      mean: 'This is over は話し合いの打ち切り。さっきの「必要」を自分で取り消す。',
      trap: '最後の okay? が遠慮に聞こえるが、念押し。This is over で決まる。',
      use: 'That’s it. We’re done here.（もういい。話は終わり）' },
  ]
};
