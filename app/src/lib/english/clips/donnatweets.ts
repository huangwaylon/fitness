// “Donna Triggers B*tch Boss Leslie | Parks and Recreation” (the official Parks and Recreation channel, Season 6): at a
// council hearing Donna's private posts mocking Leslie are read out; Leslie is hurt, asks the man who backs her whether
// she's annoying, learns from Donna's older posts that she's also her fan, and the two make up on their own terms.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 258 s (whisper repeats the last line
// to 278 s). Donna is named at 64.9 s ("It's okay, Donna") and as "Miss Meagle"; Leslie at 109.9 s; Typhoon at 49.3 s;
// Jamm at 148.6 s. The man who apologises at 145.5 s and reads the old posts at 178.4 s is never named, so stems say
// "the man". Untested on purpose: 12–26 s (the councilman's harassment suits, "talking dirty"), 0–12 s (the "big fan
// of your writing" opener: its tone is the only clue), 70–81 s and 93–98 s (profane posts, a TV-show reference),
// 117–126 s (the nickname list, "El Diablo" needs Spanish), 130–132 s (the flirty aside), 140.5 s ("done a lot of
// good": tone only), 184–198 s (the recall hashtags), 205–207 s (the racquetball callback: who says it is unclear),
// 234–250 s (the gift, mostly a list). The two hashtags are written with an asterisk, as in the title.
// REVIEW 2026-11-16: pass 2, fix 21, drop 0, new 0; ear checks 2
//   Open: nt1's speaker for "I think a lot of things… I like thinking" is unsettled; the key (the joke is on him) now holds either way.
// EAR CHECK: 157.0 s x1 — "trying to" said as "tryna" (both sources have "trying to protect")
// EAR CHECK: 230.7 s s1 — "can't" (both sources); its t is unreleased, so only the long, strong vowel tells it from "can"
import type { Clip } from '../types.ts';

export const donnaTweets: Clip = {
  id: 'donnatweets', video: 'cGSgmNgPVkY', title: 'Donna Triggers B*tch Boss Leslie', dur: 278, wpm: 166,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 blind 70 %: the key was the only real defense. Now three defenses; trap rewritten to match.
    // why: own time ← "personal account" heard as off-work posting; never named the department ← "never meant to
    //   embarrass the Parks Department" just before (keyword, wrong relation)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'private', seg: [26.0, 32.5],
      stem: 'What does Donna say in her own defense at first?',
      choices: ['Only people she approves can see her posts', 'She only posted on her own time, off work',
                'She never named the department in a post'],
      a: 0,
      cue: '「Parks Department」のすぐあと。',
      line: 'My personal account is *set to private*.',
      said: '「恥をかかせる気はなかった。個人のアカウントは非公開」と言う。',
      mean: 'set to private ＝ 非公開。身内しか見ないはず、という言い分。',
      trap: 'personal を「勤務外」と取ると、自分の時間の話に聞こえる。private は見る人を限る設定。',
      use: 'My profile is set to private.（プロフィールは非公開にしてるよ）' },

    // R fix: V2 blind 55 %: the brunch key was the one vivid, specific choice. Distractors now personal grudges too.
    // why: made fun of it online ← "brunch" caught while the posts are the topic, "bothered to come" missed;
    //   hairdresser ← said just before, but it's how the two are linked, not why
    { id: 'i1', skill: 'infer', level: 'B2', point: 'brunch', seg: [46.5, 55.0],
      stem: 'From Typhoon’s reply, why did Typhoon give the council access?',
      choices: ['Donna never showed up at her brunch', 'Donna made fun of her brunch online',
                'Donna took her slot at the hairdresser'], a: 0,
      cue: '「Why’d you do this?」への、Maybe で始まる返事。',
      line: 'Same hairdresser. … Maybe if you’d *bothered to come to my Great Gatsby brunch*, you’d know.',
      said: '同じ美容師つながりと分かり、理由を聞くと「ブランチに来てたらね」。',
      mean: 'if you’d bothered to ＝「わざわざ来ていれば」。来なかったことへの仕返し。',
      trap: 'hairdresser はつながりで、理由ではない。Why の答えはそのあと。',
      use: 'You could’ve bothered to call.（電話くらいくれてもよかったのに）' },

    // R fix: V2 blind 60 % (the title names Leslie, and only the key did); S3 cue had "Leslie", only in the key.
    // why: embarrassed the department ← Donna's own "never meant to embarrass the Parks Department" (keyword); push
    //   Leslie to fire her ← Leslie's "I'm not gonna let them fire you" (the fear voiced, not the council's aim)
    { id: 'g1', skill: 'gist', level: 'B2', point: 'respect', seg: [56.5, 108.2],
      stem: 'Why are Donna’s posts read out at the hearing?',
      choices: ['To show Leslie’s own staff don’t respect her', 'To push Leslie into firing Donna herself',
                'To prove Donna embarrassed the Parks Department'], a: 0,
      cue: '読み上げのあと、最後に誰を責めるか。',
      line: 'Not only do you have *no control over your department*, you don’t even have *the respect of your employees*.',
      said: '投稿を読み、「部下を管理できず、敬意もない」と Leslie を責める。',
      mean: '狙いは Leslie。部下の陰口を、上司失格の証拠に使っている。',
      trap: 'fire や embarrass で Donna が標的に見えるが、最後の you は Leslie。',
      use: 'He doesn’t have the respect of his team.（彼はチームに信頼されていない）' },

    // R fix: V2 blind 50 %, and the key echoed the stem ("posts… read"). Key reworded; "in private" swapped for a bargain.
    // why: only a few ← "a selection of tweets" heard as something she can bargain down; lawyer ← the courtroom script
    //   (recess is a court word)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'recess', seg: [57.0, 64.4],
      stem: 'Right after the posts are entered into the record, what is Donna trying to do?',
      choices: ['Have the hearing stop for a short while', 'Have only a few of the posts read out',
                'Get time to call a lawyer to help her'], a: 0,
      cue: '「Uh-oh」のあとの頼みごと。',
      line: '*Uh-oh*. Can I *request a brief recess*?',
      said: '投稿を記録に入れると言われ、「あっ…少し休憩をもらえますか」と頼む。',
      mean: 'recess ＝ 会議や裁判の休憩。読み上げを止めたい、時間かせぎの頼み。',
      trap: '裁判のような場なので、弁護士を呼ぶ話に聞こえやすい。Uh-oh は「まずい」の合図。',
      use: 'Can we take a quick break?（ちょっと休憩しませんか）' },

    // R fix: V2 blind 55 %: the key was the only choice about someone else. Now two "the posts will hurt…" choices.
    // why: doubts Leslie ← "Yeah" heard as a doubtful 「うん、でもね」; department ← her own earlier "embarrass the Parks
    //   Department"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'worried', seg: [64.0, 69.6],
      stem: 'When Leslie promises to protect her job, what does Donna’s answer imply?',
      choices: ['The posts will hurt Leslie more than her', 'She doubts Leslie can really save her job',
                'The posts will hurt the department more'], a: 0,
      cue: '「fire you」への返事。主語に注目。',
      line: 'I’m not gonna let them fire you. — Yeah, *it’s not me I’m worried about*.',
      said: '「クビにはさせない」と言われ、「心配なのは私じゃない」と返す。',
      mean: '心配なのは、投稿で傷つく Leslie のほう。名前は出さずにほのめかす。',
      trap: 'Yeah を「うん、でも」と取りやすい。It’s not me は「心配なのは別の人」。',
      use: 'It’s not the money I’m worried about.（お金の心配をしてるんじゃないの）' },

    // why: 1 to 10 ← the usual poll script; 8 to 10 / 90 to 100 ← "ninety-" or "-eight" lost in fast speech
    { id: 'n1', skill: 'number', level: 'B1', point: 'scale', seg: [81.5, 93.0], keep: true,
      stem: 'In the September poll, what scale does Donna give for rating Leslie?',
      choices: ['1 to 10', '8 to 10', '90 to 100', '98 to 100'], a: 3,
      cue: '「scale of」の直後の数字。',
      line: 'a Twitter poll *on a scale of 98 to 100*',
      said: '「レスリーのうざさを、98から100で評価して」という投票。',
      mean: 'ninety-eight to a hundred。どれを選んでもほぼ満点の目盛り。',
      trap: 'ふつうの投票は1から10なので、その型で聞きやすい。ninety と eight の両方を拾う。',
      use: 'Scale of 1 to 10, how spicy?（10段階で、辛さはどれくらい？）' },

    // R fix: V2 blind 75 %: the key was the only choice that is a joke. Stem narrowed to the scale; a direction trap added.
    // why: runs backward ← 98–100 heard as the low end, missing "ain't less than 98"; tasks ← "another annoying task" is
    //   in the post read just before
    { id: 'h1', skill: 'humor', level: 'C1', point: 'scale', seg: [81.5, 93.0],
      stem: 'What makes the poll’s scale funny?',
      choices: ['Every choice on it means “very annoying”', 'It runs backward: 98 is barely annoying',
                'It rates her on the tasks she hands out'], a: 0,
      cue: '目盛りの数字と、その直後のひと言。',
      line: 'on a scale of 98 to 100… *’cause you know it ain’t less than 98*.',
      said: '98から100で評価させ、「98より下なわけないでしょ」と付け足す。',
      mean: '形は投票でも、答えは初めから「最高にうざい」しかない。その作りが笑い。',
      trap: '98 を低い側と取ると逆向きに聞こえる。直後の ain’t less than 98 が向きを決める。',
      use: 'Pick any color, as long as it’s blue.（何色でもいいよ、青ならね）' },

    // R fix: V2 blind 60 %: "a job Leslie takes on" was the odd one out. Now a role reading.
    // why: comes with being the boss ← "your thing" heard as your role, a boss's lot; should fix ← the Japanese frame: criticism expects a
    //   fix, but "I thought that was your thing" files it as part of who she is
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'thing', seg: [109.5, 117.0],
      stem: 'Right after calling Leslie annoying, what does Donna add with “I mean…”?',
      choices: ['Being annoying is what Leslie is known for', 'Being annoying comes with being the boss',
                'Being annoying is a habit Leslie should fix'], a: 0,
      cue: '「I mean」のあと、最後の一語。',
      line: 'sometimes you’re kind of annoying. I mean, I thought that was *your thing*.',
      said: '「時々ちょっとうざいよ。それがあなたの持ち味だと思ってた」と言う。',
      mean: 'your thing ＝ その人らしさ、お決まりの特徴。悪口を半分冗談にしている。',
      trap: '注意のあとは「直して」が来ると思いやすいが、ここは「あなたらしさ」として言っている。',
      use: 'Baking is kind of my thing.（お菓子作りは、まあ私の得意分野なの）' },

    // R fix: V2 blind 65 %: "share news" was a weak filler. Now a plausible Twitter use.
    // why: keep up with coworkers ← "on Twitter… about work" heard without the verb before it; fired up ← steam read literally, as the power that
    //   drives an engine
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'steam', seg: [126.4, 132.6],
      stem: 'What does Donna say she mainly uses Twitter for?',
      choices: ['To let out the stress of her job', 'To keep up with what coworkers post', 'To get herself fired up for work'],
      a: 0,
      cue: '「the only reason」のあと、work の前。',
      line: 'the only reason I’m even on Twitter is to *blow off steam* about work…',
      said: '「ツイッターは、仕事のうっぷん晴らしのためだけ」と言う。',
      mean: 'blow off steam ＝ たまったストレスを発散する。悪意はない、という言い分。',
      trap: 'steam を「勢い・動力」と取ると、やる気を出す意味に聞こえる。蒸気を「抜く」イメージ。',
      use: 'I go running to blow off steam.（ストレス発散に走ってる）' },

    // R fix: S4 seg end moved to 137.2 so "years" isn't clipped.
    // why: 20 ← ten/twenty blur at speed; 2 ← "through" heard as "two", so a number seems to come early
    { id: 'n2', skill: 'number', level: 'B1', point: 'years', seg: [132.6, 137.2], keep: true,
      stem: 'How long does Donna say they have been through things together?',
      choices: ['2 years', '10 years', '20 years'], a: 1,
      cue: '「we’ve been through」のあと。',
      line: 'after all we’ve been through *the last 10 years*?',
      said: '「この10年いろいろあったのに、私が嫌ってると思う？」と聞く。',
      mean: 'after all we’ve been through ＝ 一緒に乗りこえてきたのに。',
      trap: 'through が two に近く聞こえることがある。数字は last のすぐあと。',
      use: 'After all we’ve been through, really?（あれだけのことがあったのに、本当に？）' },

    // R fix: V2 blind 50 %: the key was the only unsure choice. Now two "Hurt" choices, split by "don't know".
    // why: sure she hates her ← "don't" lost, and the posts just read out seem to prove it; teasing ← the Japanese frame:
    //   a reply to "after all these years" expected to make up
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'dontknow', seg: [132.8, 139.6],
      stem: 'How does Leslie sound when she answers Donna’s last question?',
      choices: ['Hurt, and really not sure about Donna now', 'Hurt, and now sure that Donna hates her',
                'Teasing, since she knows Donna likes her'], a: 0,
      cue: '長い付き合いの話のあとの、短い答え。',
      line: 'You really think I hate you…? — I *honestly don’t know anymore*.',
      said: '「本気で嫌われてると思う？」に、「正直、もう分からない」と答える。',
      mean: 'anymore ＝ 前は信じていたが、今は自信がない。傷ついている。',
      trap: 'don’t が弱いと「分かってる」に聞こえる。honestly と anymore が迷いの合図。',
      use: 'Honestly, I’m not sure anymore.（正直、もう自信がない）' },

    // why: the posts ← the last scene's pain, so the apology is heard as about that; couldn't make it ← "could not" and
    //   "hearings" caught without "postpone"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'postpone', seg: [145.0, 150.6],
      stem: 'At the start of the next scene, why does the man apologize to Leslie?',
      choices: ['He couldn’t get the hearings put off', 'He couldn’t stop the posts being read',
                'He couldn’t make it to the hearing'], a: 0,
      cue: '「I’m sorry, but」のあと。',
      line: 'I’m sorry, but I *could not postpone* these pointless hearings that Jamm is having.',
      said: '「ごめん、ジャムが開くこの無意味な公聴会を、延期できなかった」と謝る。',
      mean: 'postpone ＝ 延期する。止めようと動いたが、ジャムが本気で無理だった、という報告。',
      trap: '前の場面がつらいので投稿の件に聞こえやすいが、謝っているのは日程のこと。',
      use: 'Can we postpone till Friday?（金曜まで延期できる？）' },

    // R fix: V2 blind 60 %: the key was the only joke-shaped choice. All three now say what his yes does.
    // why: admits what he denied ← "Are you lying?" was asked just before, so a yes reads as a confession; Donna ← the
    //   yes heard as answering the whole topic, not the moment
    { id: 'h2', skill: 'humor', level: 'C1', point: 'rightnow', seg: [152.2, 161.9],
      stem: 'Why does his answer to her fourth question get a laugh?',
      choices: ['His yes is only about this moment', 'His yes admits what he denied before',
                'His yes sides with Donna’s posts after all'], a: 0,
      cue: '4つ目の質問の、最後の2語。',
      line: 'Do you think I’m being annoying *right now*? — *Yes*.',
      said: '「うざい？」「いや」「うそ？」「いや」のあと、「今うざい？」に「うん」。',
      mean: '質問攻めそのものがうざい、という返し。right now がその場に限る。',
      trap: '直前の Are you lying? から、前の答えがうそだったと取りやすい。今この瞬間の話。',
      use: 'Am I talking too much right now?（今しゃべりすぎてる？）' },

    // R fix: S4 the segment began inside "lying" (155.7–156.2); now 156.25–158.55, after it and before "Do you".
    { id: 'x1', skill: 'dict', level: 'B2', point: 'protect', seg: [156.25, 158.55],
      stem: 'Type what Leslie asks: “Are you ___ my feelings?” (3 words)', answer: 'trying to protect',
      cue: '「Are you lying?」の次の質問。',
      line: 'Are you *trying to protect* my feelings?',
      said: '「私の気持ちを守ろうとしてる？」と聞く。',
      mean: 'trying to は「トライナ」のように縮み、to はほぼ聞こえない。',
      trap: 'to が消えると trying protect に聞こえる。try のあとには to が隠れていると考える。',
      use: 'I’m just trying to help.（助けようとしてるだけだよ）' },

    // R fix: K1/V1 the key named Leslie as the mimic, but no name settles who says "I think a lot of things… I like
    //   thinking". Stem, key and notes now hold whoever says it: "Now who's annoying?" lands on him either way.
    // anchor: 162.6–170.1 s he opens three clauses with "I think (that)…"; 174.5–177.7 s more "I think… I like thinking.
    //   And racquetball.", then "Now who's annoying?" turns the word "annoying" from Leslie onto him
    // why: Leslie ← "worried" fits her string of questions just before, and she's the one called annoying (right
    //   mechanism, wrong target); Donna ← the scene's earlier target, and "annoying" was the word of her posts
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'thinking', seg: [162.4, 178.2],
      stem: 'Right after his advice, who is the joke on?',
      choices: ['On him, after all his careful advice', 'On Leslie, for being so worried about it',
                'On Donna, whose posts started all of this'], a: 0,
      cue: '文頭の I think のくり返しと、最後の Now who’s。',
      line: '*I think* that you ask a lot… I think a lot of things. I like thinking. … *Now who’s annoying?*',
      said: '彼は I think… を重ねて助言する。さらに I think が続き、「今うざいのはどっち？」で落とす。',
      mean: '「うざい」の矛先が Leslie から、助言した彼に移る。',
      trap: 'I like thinking を自分語りと取ると Leslie の話に聞こえる。who が誰を指すかを聞く。',
      use: 'Now who’s being dramatic?（さあ、大げさなのはどっち？）' },

    // R fix: V2 blind 55 %: "quit the department" was an outsized outcome. Now a tiredness reading.
    // why: worn out ← "driving people hard" heard as tiring them (a likely result, not the idiom); work faster ← read as
    //   the result, not the cost
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'feathers', seg: [168.6, 174.2],
      stem: 'What does the man say pushing people as hard as Leslie does can do?',
      choices: ['Make some people upset with her', 'Make some people worn out and tired',
                'Make some people work even faster'], a: 0,
      cue: '「but I also think」のあと、最後の部分。',
      line: 'driving people as hard as you do can *ruffle some feathers*.',
      said: '「みんなを強く引っぱると、反感を買うこともある」と言う。',
      mean: 'ruffle feathers ＝ 羽を逆立てる → 人をいらっとさせる。柔らかい批判。',
      trap: 'drive hard を成果の話と取ると、速く働く意味に引かれる。but のあとは注意の話。',
      use: 'I don’t want to ruffle any feathers.（波風を立てたくないんだ）' },

    // R fix: V2 blind 75 %: "Leslie or Donna" was a weak filler. Now a boss-or-friend reading of "endearment".
    // why: boss or friend ← "sister from another Mr." was just read, and "endearment" sounds like friendship; how angry ←
    //   "an indication of her frustration" is said (keyword)
    { id: 'd5', skill: 'detail', level: 'B2', point: 'order', seg: [198.5, 207.4],
      stem: 'Reading the two hashtags, what does the man say their word order changes?',
      choices: ['Whether it’s an insult or a compliment', 'Whether it praises her as a boss or a friend',
                'How angry Donna was when she wrote it'], a: 0,
      cue: '「whereas」で始まる文の、前半と後半。',
      line: '…is clearly *an indication of her frustration*, boss b*tch is *a term of endearment*.',
      said: '「b*tch boss はいらだち、boss b*tch は親しみ」と説明する。',
      mean: '同じ2語でも後ろの語が中心。boss b*tch は「できる女」のほめ言葉。',
      trap: 'frustration で怒りの度合いと取りやすい。whereas は対比の合図。',
      use: 'It’s a term of endearment, I promise.（親しみをこめた呼び方だよ、本当に）' },

    // R fix: V2 blind 60 %: the key was the only hedged choice, and "not sorry at all" was an absolute. Now Partly/Fully.
    // why: fully ← "I'm sorry if I can be a little annoying" heard without the "but" that follows; ask less ← the man's
    //   advice in the scene before ("you ask a lot of the people") taken as her promise
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'heroic', seg: [210.4, 220.2],
      stem: 'How sorry is Leslie in her apology to Donna?',
      choices: ['Partly: she recasts annoying as heroic', 'Fully: she owns being annoying at times',
                'Partly: she promises to ask less of staff'], a: 0,
      cue: '「I’m sorry if」のあと、but から先。',
      line: 'I’m sorry if I can be a little annoying at times. But one person’s annoying is *another person’s inspiring and heroic*.',
      said: '「うざかったらごめん。でも見方を変えれば、うざいは英雄的」と言う。',
      mean: '謝りながら、うざさを長所に言いかえる。半分だけの謝罪で、Leslie らしい開き直り。',
      trap: 'I’m sorry で完全な謝罪と思いやすい。if と but のあとに本音が来る。',
      use: 'I’m sorry if that came out wrong.（言い方が悪かったらごめん）' },

    // R fix: V2 blind 60 %: the key was the only two-sided choice. Now two "Each says sorry" choices.
    // why: do better ← the usual make-up script, and "promise" is said twice (keyword); stop posting ← the same script,
    //   one-sided
    { id: 'g2', skill: 'gist', level: 'B1', point: 'deal', reveals: ['cant', 'heroic'], seg: [210.4, 233.6],
      stem: 'How do Leslie and Donna make up at the end?',
      choices: ['Each says sorry, but neither promises to change', 'Each says sorry and promises to do better',
                'Donna says sorry and promises to stop posting'], a: 0,
      cue: '謝ったあと、二人とも約束について言う部分。',
      said: '二人とも謝るが、Leslie は「英雄的なのは変えない」、Donna は「文句も言う」と返す。',
      mean: '性格は変えずに受け入れ合う仲直り。Deal ＝「それで決まり」。',
      trap: '仲直りには「もうしません」が付くと思いやすいが、ここは約束しないことを約束する。',
      use: 'Deal. Let’s shake on it.（決まり。握手しよう）' },

    // R fix: V2 blind 65 %: "can't remember" was weak. Now a scope near miss (none at all).
    // why: not sorry for any ← the take-back heard as cancelling the whole apology (scope); even more ← "some" heard as
    //   adding (the man just read out "some more things")
    { id: 'i5', skill: 'infer', level: 'B2', point: 'some', seg: [219.9, 225.2],
      stem: 'When Donna adds a few words to her apology, what does that show?',
      choices: ['She still stands by part of what she wrote', 'She isn’t really sorry for any of it',
                'She wants to say sorry for even more posts'], a: 0,
      cue: '謝ったあと、すぐ付け足す短い言葉。',
      line: 'And I’m sorry for writing those things. *Some of those things*.',
      said: '「ああいうことを書いてごめん。…一部はね」と言い直す。',
      mean: '全部は撤回しない、という本音。謝りながら、言い直しで笑いを取っている。',
      trap: 'some を「ほかにも」と足し算に取りやすい。言い直しは範囲をせばめるだけで、全部の取り消しでもない。',
      use: 'I liked the movie. Most of it.（映画、よかった。大部分はね）' },

    // R fix: V2 blind 70 %: "could promise" was the one odd tense, so meaning split it 2 ways. Now "won't promise".
    // why: can ← the t of can't is unreleased, so it sounds like "can" (and "I can promise" makes sense too); won't ←
    //   the -n't is heard but the onset is lost, and a refusal fits the meaning
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [229.9, 233.0],
      stem: 'Fill the gap in Donna’s reply: “And I ___ that I won’t complain about it.”',
      choices: ['can promise', 'can’t promise', 'won’t promise'], a: 1,
      cue: 'promise の直前、母音の長さと強さ。',
      line: 'And I *can’t promise* that I won’t complain about it.',
      said: '「私も、文句を言わないとは約束できない」と返す。',
      mean: 'can’t は t がほぼ聞こえず、母音が長く強い。can は弱く短い「クン」。',
      trap: 't が聞こえないと can に聞こえる。強く長い「キャーン」なら can’t と考える。',
      use: 'I can’t promise, but I’ll try.（約束はできないけど、やってみる）' },

    // anchor: 230.3–233.1 s "I can't promise that I won't complain about it. — Deal." (teasing is part of the deal);
    //   254.9–257.6 s Donna's tag for Leslie is a teasing one ("psycho boss"), and Leslie answers "I don't hate that"
    // R fix: V2 blind 60 %: "Donna now praises her" was the weaker near miss. Now Donna giving in on the two tags offered.
    // why: picks the tag Leslie wanted ← the two tags offered just before, and the "deal" heard as Donna giving in
    //   (right relationship, wrong direction);
    //   hides hurt ← the Japanese frame: 我慢して場を収める
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'psycho', seg: [233.6, 258.4],
      stem: 'What does the hashtag exchange show about Leslie and Donna now?',
      choices: ['Teasing is fine again; it reads as warmth', 'Donna gives in; she picks the tag Leslie wanted',
                'The hurt remains; Leslie hides it for peace'], a: 0,
      cue: '仲直りの直後、ハッシュタグの中身と返事。',
      line: 'What’s the hashtag gonna be? … — It’s *psycho boss*. — *I don’t hate that*.',
      said: '仲直りのあと、タグを聞かれた Donna は「サイコ・ボス」。Leslie は「悪くないね」。',
      mean: 'からかいが、また親しみとして通じる仲に戻った。双方がそれを分かっている。',
      trap: '仲直りの直後なのでほめ言葉を期待しやすい。からかいを笑って受けるのが信頼のしるし。',
      use: 'You’re a menace, and I love you.（ほんと困った人、でも大好き）' },

    // R fix: V2 blind 55 %: "hates it and wants it changed" was the one strong absolute. Now a literal "not hate" reading.
    // why: no real feeling ← "I don't hate that" taken literally, as merely "not hate"; dislikes but lets it go ←
    //   「嫌いではない」 read as quiet putting-up (遠慮)
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'psycho', seg: [251.6, 258.4],
      stem: 'How does Leslie feel about the hashtag Donna picks?',
      choices: ['She likes it more than she says', 'She dislikes it but lets it go', 'She has no real feeling about it'],
      a: 0,
      cue: '最後のひと言、否定の小さな語。',
      line: 'It’s psycho boss. — I *don’t hate that*.',
      said: '「ハッシュタグはサイコ・ボス」と言われ、「それ、悪くないね」と返す。',
      mean: 'I don’t hate that ＝ 控えめな「気に入った」。照れた好意。',
      trap: 'I don’t hate を文字通り「どうでもいい」と取りやすい。否定＋強い語は控えめな好意。',
      use: 'Pineapple pizza? I don’t hate it.（パイナップルのピザ？悪くないね）' },
  ]
};
