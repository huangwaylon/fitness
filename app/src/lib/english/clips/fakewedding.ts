// “Ross & Rachel's Fake Wedding | Friends” (the official Friends channel, Best of Season 8): at his parents' party for
// 35 years of marriage, Ross and Rachel learn that the parents have told their friends the two are married (the baby is
// "out of wedlock"); they agree to say nothing and just nod along, then dream up a grand wedding for the relatives,
// and Ross ends with a heartfelt proposal story.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Jack (16.3 s), Ross (88 s, 173.8 s),
// Rachel (88.8 s), Aunt Lisa and Uncle Dan (89–92 s), Catherine (29.7 s); "Mom", "Dad" (whisper only, 58 s) and "Son"
// (61.7 s, both) settle who the parents are. The bride is never named by the speaker, so items say "the bride".
// Untested on purpose: Stevie Wonder, Annie Leibovitz, Fred Astaire (world knowledge; i2 is answerable from “film in
// the camera”); 162–165 s "I'm not you" (the joke needs the show's backstory); 104–106 s "Unbelievable. — I love
// married life." (captions lack the second line and time the first at 110 s); 113 s "Yeah, baby"; 218.8 s whisper
// "lilies", captions "lies"; 222.3 s whisper "Shh, I want to hear the rest", captions "you want to hear the rest";
// 243 s "the ring was the size of my fist" (speaker unclear).
// REVIEW 2026-11-17: pass 9, fix 15, drop 0, new 0; ear checks 1
// OPEN: g2 is still guessable from the title ("Fake Wedding"), with a cold read at 80 %; the scene's ask is the
//   title, and I found no other angle that keeps one best answer. c2's 15.4 s segment is over 15 s (a C2 needing
//   both lines; earlier reviews allowed C2 up to 25 s)
// EAR CHECK: 174.6–178.4 s r1 — the cut at 178.4 s falls after "realistic" and before "And my veil" (captions put
//   "realistic" at 177.7 s, whisper at 174.6 s; "And" is at 178.7 s in both)
import type { Clip } from '../types.ts';

export const fakeWedding: Clip = {
  id: 'fakewedding', video: 'NKsCkliwm9U', title: 'Ross & Rachel’s Fake Wedding', dur: 257, wpm: 140, band: 'slow',
  tags: ['家', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: 25 ← a silver-anniversary script, with only "-ty-five" caught; 45 ← thirty and forty both end in -ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', seg: [8.0, 13.88], keep: true,
      stem: 'How many years is the party celebrating?',
      choices: ['25 years', '35 years', '45 years'], a: 1,
      cue: '「great party」のすぐあと、years の前の数。',
      line: 'this is such a great party! *35 years*, very impressive.',
      said: '客が「すてきなパーティー。35年はすごい」とほめる。',
      mean: 'thirty-five years ＝ 35年。長い結婚のお祝いだと分かる。',
      trap: 'thirty と forty はどちらも -ty で終わる。最初の th と f の音を聞き分ける。',
      use: 'Happy 35th anniversary!（結婚35周年おめでとう）' },

    // R fix: V2 (blind 50 %): the key's "instead of life advice" mirrored the stem. The key is now plain, and the
    //   marriage joke is the scripted answer a 35-years-married man is expected to give
    // why: jewelry ← "pearls" read literally (pearls of wisdom = ありがたい言葉); marriage joke ← a man 35 years married is
    //   expected to joke about marriage, and nothing in his line is about it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'wisdom', seg: [13.88, 26.6],
      stem: 'Asked for pearls of wisdom, why does Jack’s answer get a laugh?',
      choices: ['He complains about something trivial', 'He jokes about how long the marriage feels',
                'He mistakes “pearls” for real jewelry'], a: 0,
      cue: '「Jack?」と話を振られたあとの、質問の中身。',
      line: 'Do you guys have any *pearls of wisdom*? — Jack? — *Why would you serve food on such a sharp stick?*',
      said: '知恵を聞かれた父が「なぜ食べ物をこんなとがった棒に刺すんだ」と言う。',
      mean: '人生の教訓を期待された場で、小さな不満を言う。そのずれが笑い。',
      trap: 'pearls を本物の真珠と取ると話が合わない。pearls of wisdom は「ためになる言葉」。',
      use: 'Any words of wisdom before I go?（行く前に何かひとことある？）' },

    // R fix: V2 (blind 55 %): the stem said "wedding", which with the title made "confused" obvious. The stem now
    //   names the moment only, so "pleased" (they were just "so excited") is live
    // why: pleased ← "We're so excited" is said just before, to the baby wishes; amused ← a one-word "What?" heard as
    //   laughing it off, the way you'd answer a joke
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'wedding', seg: [26.4, 36.05],
      stem: 'When the guest adds a second congratulation, how do they react?',
      choices: ['Confused; they don’t know what she means', 'Pleased; they are so excited about it',
                'Amused; they take it as a joke'], a: 0,
      cue: '「wedding」の直後、短い一語の返事。',
      line: 'Oh, and also, congratulations on your *wedding*. — *What?*',
      said: '赤ちゃんに続き「結婚もおめでとう」と言われ、二人は「えっ？」と返す。',
      mean: '結婚していないので、何の話か分からない。ここから両親の説明になる。',
      trap: 'so excited は赤ちゃんの話への返事。お祝いのあとの What? は「何のこと？」。',
      use: 'Wait, what? What wedding?（え、何？何の結婚式？）' },

    // R fix: V2 (blind 70 %): "keep the baby quiet" was out of place (people congratulate them on the baby). An
    //   engagement announcement, a near miss on "married", replaces it
    // why: quick wedding ← "congratulations on your wedding" and "wedlock" heard as a ceremony to stage (the title's "fake
    //   wedding" fits it too); engagement ← "wedlock" and the wedding talk heard as a future step, without "you're married"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'ask', reveals: ['told', 'pretend', 'thanks'], seg: [26.4, 66.6],
      stem: 'Why do Ross’s parents take the couple aside?',
      choices: ['To get them to play a married couple tonight', 'To get them to stage a quick wedding tonight',
                'To get them to announce an engagement tonight'], a: 0,
      cue: '「open-minded」のあと、友だちに何と話したか。',
      line: '…you’re having this baby out of wedlock… we’ve *told them all you’re married*. — What? — *Thanks for going along with this*.',
      said: '両親は、友だちに二人は結婚していると話したと言い、「合わせてくれてありがとう」と続ける。',
      mean: '頼みは、今夜だけ夫婦のふりをすること。式を挙げる話ではない。',
      trap: 'wedding が何度も聞こえて「式を挙げて」と取りやすいが、話はもう済んでいる。',
      use: 'Can you just play along tonight?（今夜だけ話を合わせてくれる？）' },

    // R fix: V2 (blind 70 %): the key was the only knowing reading. "Sorry to interrupt" is replaced by a second
    //   knowing one (owning up to a slip)
    // why: small favor ← "little thing" taken at its word; small slip ← a "little thing" that comes before a confession
    //   heard as owning up to a mistake (they call it marvelous, not a mistake)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'little', reveals: ['told'], seg: [40.95, 55.0],
      stem: 'When the parents start explaining, what does their opening line do?',
      choices: ['Makes a big ask sound small', 'Asks for a truly small favor', 'Owns up to a small slip of theirs'], a: 0,
      cue: '説明の最初の一言と、そのあとの話の大きさ。',
      line: 'Hey, it’s *just a little thing*. … we’ve told them all you’re married.',
      said: '「ちょっとしたことなんだけど」と始め、友だち全員に二人は結婚していると話したと言う。',
      mean: 'just a little thing は、大きな話を軽く見せる前置き。',
      trap: '文字通り「小さな頼み」と取りやすい。前置きが軽いほど中身は大きい。',
      use: 'It’s just a tiny favor, really.（ほんのちょっとしたお願いなんだけど）' },

    // why: marry ← "out of wedlock" heard as a push to wed; blame the couple ← right mechanism (a cover-up), wrong target:
    //   the parents hid it, not the couple
    // R fix: N7: the line shows "less open-minded", d2's key, so it now reveals 'openminded'
    { id: 'h2', skill: 'humor', level: 'C1', point: 'marvelous', reveals: ['told', 'openminded'], seg: [43.1, 55.0],
      stem: 'What makes the parents’ explanation funny?',
      choices: ['They praise it, then admit they covered it up', 'They praise it, then ask the couple to marry',
                'They praise it, then blame the couple for hiding it'], a: 0,
      cue: 'ほめ言葉のあと、「which is why」に続く話。',
      line: 'we think it’s *simply marvelous*… Some of our friends are *less open-minded*, which is why we’ve told them all you’re married.',
      said: '「未婚の出産はすばらしい。でも心の狭い友だちもいるから、結婚していると話した」と言う。',
      mean: '口では大歓迎と言いつつ、うそで隠している。言葉と行動の食い違いが笑い。',
      trap: '心が狭いのは友だちだと言うが、隠したのは両親。言葉より、何をしたかを聞く。',
      use: 'I’m totally fine with it. Really.（全然気にしてないよ。ほんとに）' },

    // R fix: V2 (blind 65 %): the title ("Fake Wedding") answered "what did they tell friends", and s1 (same point)
    //   quotes the answer. Now it asks for the reason, said in "less open-minded" (point 'openminded', reveals 'told')
    // why: kept asking ← friends at a party heard as nosy guests; rumors ← "some of our friends" + a secret heard as
    //   gossip already going round
    { id: 'd2', skill: 'detail', level: 'B2', point: 'openminded', reveals: ['told'], seg: [49.6, 55.0],
      stem: 'Why did the parents make up a story for their friends?',
      choices: ['Some of their friends would disapprove', 'Some of their friends kept asking',
                'Some of their friends had heard rumors'], a: 0,
      cue: '「Some of our friends are」のあとの形容詞。',
      line: 'Some of our friends are *less open-minded*, which is why we’ve told them all you’re married.',
      said: '「心の狭い友だちもいる。だから結婚していると言った」と話す。',
      mean: 'less open-minded ＝ 考えが古い。未婚の出産を悪く言われないための作り話。',
      trap: '友だちの話なので「しつこく聞かれた」と取りやすい。理由は friends のあとの形容詞。',
      use: 'My parents are a bit old-fashioned.（うちの親、ちょっと考えが古いの）' },

    // why: we ← 've is a weak /v/ that all but vanishes before "told"; we'd ← the same weak sound read as past perfect
    { id: 's1', skill: 'sound', level: 'B2', point: 'told', seg: [49.6, 55.0],
      stem: 'Fill the gap: “…which is why ___ told them all you’re married.”',
      choices: ['we', 'we’ve', 'we’d'], a: 1,
      cue: 'why のあと、told の前の弱い音。',
      line: 'which is why *we’ve* told them all you’re married.',
      said: '「だからみんなに結婚していると言ってある」。we’ve は「ウィヴ」と一瞬。',
      mean: 'we’ve told ＝ もう話してしまった。今さら取り消せない含み。',
      trap: '’ve の v は told の前でほぼ消える。今に続く話なら have が入る。',
      use: 'We’ve already told the kids.（もう子どもたちに話しちゃった）' },

    // R fix: V2 (blind 70 %): "thanks for coming" was off the line. It's now a thanks that misreads the couple's
    //   "What?" as calm
    // why: taking it calmly ← "Thanks for going along" heard as thanks for their reaction (but they just said "What?");
    //   sorry for not asking ← the Japanese frame: an apology expected after springing something on someone
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'thanks', reveals: ['told'], seg: [49.6, 58.6],
      stem: 'Right after the couple’s “What?”, what does the parents’ next line do?',
      choices: ['Treats their agreement as already given', 'Thanks them for taking the news calmly',
                'Says sorry for not asking them first'], a: 0,
      cue: '「What?」のすぐあと、返事を待たずに出る一言。',
      line: 'we’ve told them all you’re married. — What? — *Thanks for going along with this*.',
      said: '「えっ？」と驚く二人に、返事も聞かずに「合わせてくれてありがとう」と言う。',
      mean: '先にお礼を言い、引き受けたことにしてしまう。断りにくくする言い方。',
      trap: 'Thanks で「落ち着いてくれた」お礼と取りやすいが、二人は驚いたまま。for のあとを聞く。',
      use: 'Thanks for covering for me tomorrow!（明日の代わり、よろしくね！）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'thanks', seg: [55.0, 58.6],
      stem: 'Type what the parent says: “Thanks for ___ this.” (3 words)', answer: 'going along with',
      cue: '「What?」のすぐあと、Thanks for に続く部分。',
      line: 'Thanks for *going along with* this.',
      said: '3語がつながり「ゴーインガロンウィズ」に近く聞こえる。',
      mean: 'go along with ～ ＝ 〜に合わせる。賛成でなくても乗っておく感じ。',
      trap: 'going の g はほぼ消えて along とつながる。with も弱く this と一続き。',
      use: 'I’ll go along with whatever you decide.（君が決めたことに合わせるよ）' },

    // why: Rachel ← she is the other half of the "married" couple; to Ross ← the couple talking between themselves, but
    //   the father answers it
    { id: 'w1', skill: 'who', level: 'B1', point: 'pretend', reveals: ['ears'], seg: [55.0, 66.6],
      stem: 'Who asks whether they really have to pretend?',
      choices: ['Ross, to his parents', 'Rachel, to Ross’s parents', 'Rachel, quietly to Ross'], a: 0,
      cue: 'その質問に答える人が、最初に相手を何と呼ぶか。',
      line: 'we have to *pretend* that we’re married? — *Son*, I had to shave my ears for tonight.',
      said: '「結婚してるふりをしろってこと？」と聞かれ、父が「息子よ」と呼びかけて答える。',
      mean: '父が Son と呼ぶので、聞いたのは Ross。名前の代わりの呼びかけが手がかりになる。',
      trap: '頼まれた二人のどちらでもありそうに聞こえる。答える側の呼びかけで決める。',
      use: 'Son, trust me on this one.（息子よ、ここは信じてくれ）' },

    // why: tidy up ← "shave" heard as advice for Ross's own grooming; hard of hearing ← "ears" heard as hearing
    { id: 'i1', skill: 'infer', level: 'B2', point: 'ears', reveals: ['pretend'], seg: [55.0, 66.6],
      stem: 'What is Jack’s point when he brings up his own ears?',
      choices: ['He put up with something, so Ross can too', 'Ross should tidy himself up for tonight',
                'He can’t hear well, so Ross should speak up'], a: 0,
      cue: '耳の話のあとの、短い励ましの一言。',
      line: 'Son, I had to *shave my ears* for tonight. *You can do this*.',
      said: '「今夜のために耳の毛までそった。お前にもできる」と言う。',
      mean: '自分も今夜のために我慢した、だからお前も、という理屈。比べる物の差がおかしい。',
      trap: 'ears で「聞こえ」の話と取りやすい。shave と You can do this をつなげる。',
      use: 'If I can do it, you can too.（私にできるなら、君にもできる）' },

    // R fix: V2 (blind 50 %): "shave his neck" broke the tidy-up frame. Now nose and neck share it, so only
    //   "nozzle" settles it
    // why: skip it ← "take a pass" read as "pass on it" (やめておく, as in "I'll take a pass"); neck ← "nozzle" not known as
    //   slang, so the nearest body part to the ears is guessed
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'nozzle', seg: [66.6, 73.75],
      stem: 'In the reply about Jack’s ears, what is he told to do next?',
      choices: ['Tidy up his nose as well', 'Leave his nose alone', 'Tidy up his neck as well'], a: 0,
      cue: '「ears」のあと、area で終わる部分。',
      line: 'if you’re gonna do the ears, you may as well *take a pass at the nozzle area*.',
      said: '「耳をやるなら、鼻のあたりもついでに」と返す。',
      mean: 'take a pass at ＝ ざっと手を入れる。nozzle（ノズル）は鼻のふざけた言い方。',
      trap: 'I’ll take a pass（遠慮しとく）と混ざりやすい。pass at なら「やってみる」。',
      use: 'Can you take a pass at my essay?（作文、ざっと見てくれる？）' },

    // R fix: V2 (blind 60 %): "delight at playing husband and wife" was far off. Relief at "one night" (said soon
    //   after) replaces it. Ear check removed: the "No, no" correction shows the asker speaks again
    // why: amused by the ears ← the reply takes it that way (h4's joke); relief ← "it's one night" comes a few lines
    //   later
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'believe', seg: [66.6, 77.25],
      stem: 'Once the parents leave, what is behind “Can you believe that?”',
      choices: ['Shock at being asked to fake a marriage', 'Amusement at the story about his ears',
                'Relief that it is only for one night'], a: 0,
      cue: '返事のあと、「No, no」で言い直す部分。',
      line: '*Can you believe that?* — …if you’re gonna do the ears… — *No, no, I don’t want to lie* about us being married.',
      said: '「信じられる？」に耳の話で返され、「いや、うそをつくのが嫌なんだ」と言い直す。',
      mean: 'ここでは、あきれた驚き。何に驚いたかは言い直しで分かる。',
      trap: '返事が耳の話なので、そちらに引かれやすい。No, no は「そうじゃなくて」の合図。',
      use: 'Can you believe that? Ten dollars for coffee!（信じられる？コーヒーに10ドル！）' },

    // R fix: V2 (blind 65 %): "Jack should stop shaving" was a stretch. Now "Jack went too far with the ears" (the
    //   right topic, the wrong direction) competes with the key
    // why: agrees the lie is too much ← "I know" heard as agreeing with the complaint; Jack went too far ← "I know" + "do
    //   the ears" heard as a jab at the grooming (but "may as well" asks for more)
    { id: 'h4', skill: 'humor', level: 'C1', point: 'believe', reveals: ['nozzle'], seg: [66.6, 77.25],
      stem: 'Why is the answer to “Can you believe that?” funny?',
      choices: ['It goes for the ears, not the lie', 'It agrees the lie goes too far', 'It says Jack overdid the ears'],
      a: 0,
      cue: '返事の中身と、そのあとの「No, no」。',
      line: '…if you’re gonna *do the ears*, you may as well take a pass at the *nozzle area*. — No, no, I don’t want to lie…',
      said: '耳の話で返され、「そうじゃなくて、うそが嫌」と言い直す。',
      mean: '驚きの中身を取り違え、耳毛の話に乗る。nozzle は鼻のふざけた言い方。',
      trap: 'I know は同意に聞こえるが、続くのは耳の話。may as well は「ついでに」。',
      use: 'While you’re at it, do the windows too.（ついでに窓もお願い）' },

    // R fix: V2 (blind 65 %): "how does the plan turn out" promised a twist, and "slip up" was the only other twist.
    //   The stem is neutral now, and the agreed plan ("smile and nod") is a full distractor
    // why: smile and nod ← the plan they agree on ("we'll smile, we'll nod along"); steer to the baby ← the guests
    //   congratulate them on the baby first, so it looks like a safe topic
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['wont'], seg: [73.65, 245.5],
      stem: 'Once the relatives start asking, what does the couple actually do?',
      choices: ['Make up a grand wedding story', 'Smile and nod, as they planned', 'Steer every question to the baby'], a: 0,
      cue: '最初の相談と、そのあとの結婚式の話の量。',
      said: '黙ってうなずくだけと決めたのに、式の場所や有名人の歌など、話をどんどん盛っていく。',
      mean: '黙っているはずの計画が、夢の結婚式の作り話に変わる。その落差が場面の流れ。',
      trap: '最初の相談だけ聞くと「黙ってうなずく」に引かれる。計画と実際のずれを追う。',
      use: 'So much for keeping it low-key.（目立たないようにするはずだったのに）' },

    // why: want to ← won't /woʊnt/ and want /wɑnt/ blur for Japanese ears; wouldn't ← the -n't is caught, the vowel isn't;
    //   don't ← "don't" was just said in the same line ("we don't even have to lie")
    { id: 's2', skill: 'sound', level: 'B2', point: 'wont', seg: [81.0, 84.3],
      stem: 'Fill the gap: “…we just ___ say anything.”',
      choices: ['won’t', 'want to', 'wouldn’t', 'don’t'], a: 0,
      cue: 'just のあと、say の前の短い語。母音に注目。',
      line: 'we don’t even have to lie, we just *won’t* say anything.',
      said: '「うそもつかない。何も言わないだけ」。won’t は「ウォウン」。',
      mean: '黙っていればうそにはならない、という理屈。',
      trap: 'won’t（ウォウ）と want（ワ）は母音で聞き分ける。t は消えても母音は残る。',
      use: 'I won’t say a word.（誰にも言わないよ）' },

    // why: Bahamas ← Barbados and Bahamas share "Ba-" and the island picture; boat ← "at sunset" pictured out at sea
    { id: 'd4', skill: 'detail', level: 'B1', point: 'where', seg: [128.85, 134.2],
      stem: 'Where was the wedding, according to their story?',
      choices: ['On a cliff in Barbados', 'On a beach in the Bahamas', 'On a boat off Barbados'], a: 0,
      cue: '「Where did you have it?」のすぐあと。',
      line: 'Where did you have it? — *On a cliff in Barbados*. — At sunset.',
      said: '「どこで挙げたの？」に「バルバドスの崖の上。夕日の時」と答える。',
      mean: 'cliff ＝ 崖。小さな式のはずが、南の島の絶景になっていく。',
      trap: 'Barbados と Bahamas は出だしが似ている。beach の長い「イー」は聞こえない。',
      use: 'We got married on a beach.（ビーチで結婚式を挙げたの）' },

    // why: not back yet ← the usual reason there are no photos yet; not allowed ← a private wedding suggests a no-camera
    //   rule
    { id: 'i2', skill: 'infer', level: 'B2', point: 'pictures', seg: [141.25, 154.5],
      stem: 'From what they say, why can’t the guests see any pictures?',
      choices: ['The photographer forgot to load film', 'The pictures haven’t come back yet',
                'Cameras weren’t allowed at the wedding'], a: 0,
      cue: '「pictures」のあと、You wouldn’t think で始まる文。',
      line: 'I’d love to see pictures. — Yeah, so would I. *You wouldn’t think* that Annie Leibovitz *would forget to put film in the camera*.',
      said: '「写真を見たい」に「私も。まさか写真家がフィルムを入れ忘れるとは」と返す。',
      mean: 'まさか〜とは、の形で「実際に忘れた」と言う。写真がない言い訳。',
      trap: '名前を知らなくても film と camera で写真家だと分かる。この形は「でも実際は」。',
      use: 'You wouldn’t think it’d rain in July.（7月に雨なんて思わないよね）' },

    // R fix: V2 (blind 70 %): "admits none of it happened" was a weak filler. A personal, unshowy detail (the move
    //   Ross makes later) replaces it
    // why: plain ← "it has to be realistic" taken at its word, as a step back; personal ← Ross's own story later is
    //   built that way
    { id: 'r1', skill: 'predict', level: 'B2', point: 'realistic', reveals: ['nuns'], seg: [166.9, 178.4],
      then: [178.4, 187.7],
      stem: 'After “Okay, Ross, it has to be realistic”, what kind of detail comes next?',
      choices: ['One that is even harder to believe', 'One that sounds plain and believable',
                'One that is personal, not showy'], a: 0,
      cue: 'ハーレー案を止めた本人が、次に何を言うか。',
      line: 'Okay, Ross, it has to be *realistic*. … And my veil was lace made by *blind Belgian nuns*.',
      said: 'ハーレー案を「現実的に」と止めた直後、「ベールは目の見えない修道女の手作り」と言う。',
      mean: '注意した直後に、自分がもっと非現実的なことを言う笑いの型。',
      trap: '「現実的に」を文字通り受けると地味な話を予想しやすい。',
      use: 'Let’s keep it realistic, okay?（現実的にいこうよ）' },

    // R fix: V2 (blind 55 %): "born unable to see" missed "not at first" too plainly. It's now "only some were
    //   blind", the commoner misreading of "not at first"
    // why: made up ← "not at first" heard as backing down; only some ← "not at first" heard as "not all"
    { id: 'h5', skill: 'humor', level: 'C1', point: 'nuns', seg: [178.3, 191.5],
      stem: 'Why does the answer to “Blind?” get a laugh?',
      choices: ['It means the veil work cost them their sight', 'It admits she made the nuns up just now',
                'It says only some of the nuns were blind'], a: 0,
      cue: '「not at first」のあとに続く説明。',
      line: '…made by blind Belgian nuns. — Blind? — Well, *not at first*, but it was very intricate work… *even though they lost their sight, it was all worth it*.',
      said: '「目が見えない？」に「最初は見えてた。失明しても価値があったって」と答える。',
      mean: '自分のベールで修道女が失明した話を美談のように語る、ずうずうしさが笑い。',
      trap: 'not at first を「全員ではない」と取りやすい。first は時間の話。',
      use: 'It was hard, but totally worth it.（大変だったけど、やる価値はあった）' },

    // R fix: N6: notes were 128 characters (over before this review), now cut to ≤ 120. Choices pass
    // anchor: 194.4–199.2 s "I don't know about that, but there were some people that said I looked like a floating
    //   angel": the "but" turns the modest opener into a bigger claim than the guest's "beautiful"
    // why: modest ← "I don't know about that" taken as real 謙遜 (the literal hedge); doubts them ← "some people said"
    //   heard as hearsay she won't vouch for (right words, wrong direction)
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'angel', seg: [191.35, 200.9],
      stem: 'Told she must have looked beautiful, what is the bride doing with her answer?',
      choices: ['Boasting while seeming to play it down', 'Playing it down, as a polite bride would',
                'Passing on praise she doesn’t quite trust'], a: 0,
      cue: '控えめな前置きのあと、but に続く言葉の大きさ。',
      line: 'Oh, well, I *don’t know about that*, *but* there were some people that said I looked like *a floating angel*.',
      said: '「きれいだったでしょう」に「どうかな。でも天使みたいと言う人もいた」と答える。',
      mean: '控えめな前置きは形だけ。but のあと、相手より大きなほめ言葉を人の口を借りて言う自慢。',
      trap: '前半だけなら謙遜に見える。「どうかな、でも」の but のあとが本音。',
      use: 'I don’t like to brag, but I won.（自慢じゃないけど、勝ったよ）' },

    // why: favorite flowers ← "her favorite flower" comes in the next line (what he filled the room with); she loved it ←
    //   the usual romantic reason, and "the planetarium" with "stars" later sounds like her dream
    { id: 'd5', skill: 'detail', level: 'B1', point: 'firstdate', seg: [206.8, 220.95],
      stem: 'Why does Ross say he chose that place to propose?',
      choices: ['It was where they had their first date', 'It was known for her favorite flower',
                'It was the place she had always loved'], a: 0,
      cue: '「planetarium」の直後の一文。',
      line: 'I took her to the planetarium. *That’s where we had our first date*. … the room filled with… her favorite flower.',
      said: '「プラネタリウムに連れていった。最初のデートの場所なんだ」と話す。',
      mean: '場所を選んだ理由は二人の思い出。作り話でも、彼女に関わる具体的な話になっている。',
      trap: 'すぐあとに花の話が続くので、花を理由と取りやすい。花は彼が部屋に用意したもの。',
      use: 'This is where we first met.（ここで初めて会ったんだ）' },

    // anchor: 207.3–220.8 s "that's where we had our first date", "the room filled with… her favorite flower": details
    //   about her, against the bride's cliff, famous singer and blind nuns; "That is so sweet" (221.1 s) is how it lands
    // R fix (its one C2 rewrite): V2 (blind 55 %): the key was the only warm choice. All three now name what the
    //   story is built from
    // why: his parents ← a nervous liar borrowing a real story, at his parents' anniversary; grand but vague ← the
    //   "Well, um, actually I, I…" start heard as reluctance to commit to details (the stammer, not the content)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'firstdate', seg: [206.8, 222.2],
      stem: 'Set beside the bride’s story, what is Ross’s proposal story built on?',
      choices: ['Shared memories and things she loves', 'Things borrowed from his parents’ story',
                'Things that sound grand but stay vague'], a: 0,
      cue: '有名人や絶景の代わりに、何が出てくるか。',
      line: 'I took her to the planetarium. That’s where *we had our first date*. … the room filled with… *her favorite flower*.',
      said: '最初のデートの場所、彼女の好きな花と、二人に関わる話をする。',
      mean: '崖や有名人で飾った話と違い、彼女をよく知る人の話。作り話なのに本気に聞こえる。',
      trap: '借り物や手抜きと取りやすい。first date と favorite は二人だけの話。',
      use: 'I remembered your favorite song.（好きな曲、覚えてたよ）' },
  ]
};
