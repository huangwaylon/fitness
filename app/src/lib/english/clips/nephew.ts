// “Michael's Nephew - The Office US” (the official The Office channel, Best of Season 7): Michael's new assistant, his
// nephew Luke, botches the coffee run and the samples; the staff want him fired and Michael waves it off, explains to
// the camera why Luke matters to him, and then, when Luke won't stop shining a laser pointer at a training, counts down
// and punishes him, to the staff's delight.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings are 2 s blocks, so segments follow the
// captions (whose first word in each event tends to run early). Luke is named in the audio ("Luke, I want you…", "Luke,
// come on"), and so is Michael ("Needs to be fired, Michael", "Michael, do something"); the other staff are never
// named, so stems say "the speaker", "someone", "a coworker". Talk ends at ≈ 265 s (music after). Untested on purpose:
// 0–2 s (whisper "Coffee monkeys arrived. I thought the coffee was", captions "…arrived at the conference"), 4–12 s
// (Luke's nicknames for coworkers), 16 s (whisper "You want me decaf?", captions "get me decaf"), 30–39 s (an unnamed
// talking head), 52–57 s (Luke's favourite films: world knowledge), 77–79 s (whisper "He messed yours up, too",
// captions "hey mister is up to"), 88–90 s ("Venus": a jab at looks), 99–101 s (whisper "strawberries are ripe",
// captions "strawberries you're right"), 105–108 s (whisper "you don't have to yell", captions "…go"), 114 s (whisper
// "What for?", captions "before"), 181–183 s (a crude line), 195–201 s (whisper "Sack up, man", captions "a go"),
// 212–231 s (the punishment itself: shown, not said; captions silent to 223.8 s), 245–247 s ("Texas justice": world
// knowledge), 255 s (captions "you've all him on twitter", whisper "You follow him on Twitter?").
// REVIEW 2026-11-16: pass 3, fix 21, drop 0, new 0; ear checks 1. Notes trimmed to 80–120 (C2 ≤ 140) on 19 items.
// EAR CHECK: 46.6 s d2 nt3 — captions "I'm then our dog", whisper "I'm the Nard Dog"; and the stress falls on "Dog"
//   (nt3 ships only once confirmed)
import type { Clip } from '../types.ts';

export const michaelsNephew: Clip = {
  id: 'nephew', video: 'XX_WErDgCag', title: 'Michael\'s Nephew - The Office US', dur: 287, wpm: 135, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 85 %): the key was the only work-shaped choice; all three are now "keeps…" habits, and the
    //   late one leans on the captions' "…supposed to be here at 9" (no "the coffee was")
    // why: films ← Luke's own talking head ("I love cinema") heard as what annoys them; late ← "supposed to be here at
    //   9" heard about Luke, not the coffee
    { id: 'g1', skill: 'gist', level: 'B1', point: 'staff', seg: [0, 99.4],
      stem: 'In the first minute and a half, what’s the staff’s main problem with Luke?',
      choices: ['He keeps getting simple errands wrong', 'He keeps talking up the films he loves',
                'He keeps turning up late in the mornings'],
      a: 0,
      cue: 'コーヒーと書類の話、そのあとの不満。',
      said: 'コーヒーの注文を取り違え、頼まれた見本も届かない。同僚は「嫌い」「クビにすべき」と言う。',
      mean: '不満の中身は態度より仕事ぶり。簡単な用事が続けて失敗している。',
      trap: '映画好きと話す場面が残りやすいが、それは自己紹介。同僚の不満は、何を失敗したかで聞く。',
      use: 'He keeps getting my order wrong.（いつも注文を取り違えるんだ）' },

    // R fix: V2 (blind 55 %): "came earlier" was a filler; now "right on time" (the plan read as met) and a question
    //   reading
    // why: what time ← the remark heard as a question about the order; on time ← "here at 9" heard as the plan being
    //   met, with "supposed to" (a plan not met) missed
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'late', seg: [0, 6.5],
      stem: 'Right as the coffee arrives, what is the next remark doing?',
      choices: ['Pointing out that the coffee is late', 'Checking what time the coffee was ordered',
                'Saying the coffee came right on time'], a: 0,
      cue: '「arrived」のすぐあと、時刻の前の言い方。',
      line: '…*supposed to be here at 9*.',
      said: '届いたコーヒーに「9時に来るはずだった」と言う。',
      mean: 'supposed to ＝ 予定では〜のはず。届いた今言うのは、遅れたという遠回しな文句。',
      trap: '時刻だけ拾うと「時間どおり」と取りやすい。supposed to が聞こえたら、予定とのずれを疑う。',
      use: 'I thought we were supposed to meet at 7.（7時に会う約束じゃなかった？）' },

    // why: cold ← the commonest coffee complaint, read into "that says…"; wrong size ← "says" heard as reading the cup's
    //   size mark, with the last word lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'decaf', seg: [13.1, 17.4],
      stem: 'What’s wrong with one of the coffees Luke brings?',
      choices: ['It’s decaf', 'It’s cold', 'It’s the wrong size'], a: 0,
      cue: '「says」のあと、カップに書いてある一語。',
      line: '…says *decaf*.',
      said: 'カップの表示を読んで「デカフェって書いてある」と言う。',
      mean: 'decaf ＝ カフェイン抜き。頼んだものと違うという指摘で、このあと言い訳が始まる。',
      trap: 'decaf は「ディーキャフ」と短く、知らないと音が残らない。商品名の略語は音ごと覚える。',
      use: 'Is this decaf or regular?（これ、デカフェ？普通の？）' },

    // R fix: K6/V2 (blind 55 %): the third choice is now as specific as the key and carries the clip word "mix-up"
    // why: says sorry ← "drive all the way back" taken as a real offer to fix it; blames him ← "mix-up" heard as the
    //   man's own error
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'mixup', reveals: ['decaf'], seg: [18.6, 27],
      stem: 'How does Luke handle the decaf mistake?',
      choices: ['He shrugs off the blame and nudges him to keep it', 'He says sorry and rushes off to get the right one',
                'He blames the man for a mix-up in his order'], a: 0,
      cue: '「mix-up」の言い方と、最後の二択の重さ。',
      line: '…some sort of *mix-up there*. … just drink it, or should I *drive all the way back*?',
      said: '「何か手違いがあったみたい。そのまま飲む？はるばる戻ろうか？」と聞く。',
      mean: '主語のない mix-up で責任をぼかし、戻る手間を大きく言って「飲んでよ」と押している。',
      trap: '親切な申し出に聞こえるが、片方だけ大げさな二択は、答えが決まっている。',
      use: 'Looks like there was a mix-up.（手違いがあったみたいです）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    // why: one day ← "only" makes it sound brand new; four weeks ← "for a week" run together as "four weeks"
    { id: 'n1', skill: 'number', level: 'B1', point: 'week', seg: [38.9, 44], keep: true,
      stem: 'How long has the new assistant been working there?',
      choices: ['One day', 'One week', 'Four weeks'], a: 1,
      cue: '「only been here」のあと。',
      line: 'He’s only been here *for a week*.',
      said: '「まだ1週間しかいないのに」と言い、続けて「嫌い」とくり返す。',
      mean: 'for a week ＝ 1週間。来て間もないのに、もう嫌われている。',
      trap: 'for a が「フォラ」とつながり four weeks に聞こえやすい。week の s の有無で決める。',
      use: 'I’ve only been here for a week.（ここに来てまだ1週間です）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    // why: won't use it ← "calls me the…" heard without the name, as a complaint about being called anything; rude ←
    //   "Nard" sounds silly, so the nickname itself seems the problem
    { id: 'd2', skill: 'detail', level: 'B2', point: 'nard', seg: [43.9, 49.95],
      stem: 'What bugs the speaker about the new guy?',
      choices: ['He gets the speaker’s nickname wrong', 'He won’t use the speaker’s nickname',
                'He gives the speaker a rude nickname'], a: 0,
      cue: '呼ばれ方と、本人の言い直しを比べて。',
      line: 'Calls me the *Nard Man*. I’m the *Nard Dog*, okay?',
      said: '「ナードマンって呼ぶんだ。ナードドッグだよ。ナードマンは親父」と言う。',
      mean: 'あだ名自体は気に入っていて、不満は後ろ半分の違いだけ。父親の呼び名で呼ばれている。',
      trap: 'Nard が変な語なので、あだ名自体が嫌だと思いやすい。言い直しは、どこが違うかを聞く。',
      use: 'It’s Kate, not Katie, okay?（ケイティじゃなくてケイトね）', retired: true },

    // R fix: V2 (blind 60 %): the "I'm" choice was incoherent; it's now the father contrast from the next line, a real
    //   near miss that the immediate Man→Dog correction settles
    // why: on "I'm" ← "Nard Man is my father" (next line) heard as the contrast, him vs his father; on "Nard" ← the odd
    //   word sounds like the part he cares about
    // anchor: 44.97–49.53 s "Calls me the Nard Man. I'm the Nard Dog… Nard Man is my father": the two names differ only in
    //   the last word, and the father line sets Man against Dog again
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'nard', seg: [43.9, 49.95],
      stem: 'After “Calls me the Nard Man,” where’s the stress in his correction, and why?',
      choices: ['On “Dog”: the one part the new guy gets wrong', 'On “I’m”: he’s setting himself apart from his father',
                'On “Nard”: the part of the name he cares about'], a: 0,
      cue: '言い直しで、いちばん強く長く聞こえる語。',
      line: 'Calls me the Nard Man. I’m the Nard *Dog*, okay? Nard Man is my father.',
      said: '「ナードマンって呼ぶ」に続け「ナードドッグだ」と直し、「ナードマンは父」と付ける。',
      mean: '直すのは Man→Dog の一語なので、そこに強勢が来る。前の語と対比する語が強くなる型。',
      trap: '次の「父」の一言から I’m を強めたくなるが、直すのは直前の Man。強勢は、何と比べるかで決まる。',
      use: 'Not the red one. The BLUE one.（赤じゃなくて、青いほう）', retired: true },

    // R fix: V2 (blind 55 %): "agrees Luke is the worst" was refuted by the first words; now the usual defence script
    // why: asks them ← "You know who's the worst?" taken as a real question; still learning ← the usual way to defend
    //   a new hire (a broken script), heard into "He's not the worst"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'deflect', seg: [57.55, 69.3],
      stem: 'When someone says Luke should be fired, what does Michael’s reply do?',
      choices: ['It turns the talk to a different worker', 'It asks them to name the worst worker',
                'It says Luke is new and still learning'], a: 0,
      cue: '「not the worst」のあとの質問の形。',
      line: 'He’s *not the worst*, okay? You know who’s the worst? *That intern* we had a few years ago.',
      said: '「あいつは最悪じゃない。最悪は誰だと思う？前にいたインターンだ」と返す。',
      mean: '答えを待たない質問で、話題を甥から別の人へ移し、批判をかわしている。',
      trap: 'You know who…? は本当の質問でなく、自分で答える前置き。答えを待つ間があるかを聞く。',
      use: 'You know what? Let’s just order pizza.（ねえ、もうピザ頼もうよ）' },

    // R fix: V2 (blind 75 %): "looks" appeared only in the key (the cue now says 「最悪」, since "worst" is key-only); the key now says what the last line undoes, and the
    //   third choice reads "though" as a take-back about Luke
    // why: can't remember ← "that guy, remember?" heard as Michael struggling to place him; taking back ← "though" heard
    //   as undoing his defence of Luke (right mechanism, wrong target)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'intern', seg: [63.7, 75.3],
      stem: 'Why does “Good worker, though” get a laugh?',
      choices: ['It shows his “worst” had nothing to do with work', 'It shows he can’t really remember the intern',
                'It shows he’s taking back what he said about Luke'], a: 0,
      cue: '「最悪」の理由に挙げることと、最後の一言。',
      line: 'That face, how *ugly* he was. He was the worst. *Good worker, though.*',
      said: '「あの顔、ひどかったな。最悪だった。仕事はできたけど」と付け足す。',
      mean: '「最悪」の理由は顔だけで、仕事はできたと自分で認めている。かばうための比べ方が崩れる。',
      trap: 'worst を仕事の評価と取ると笑えない。though の一言は前の話を打ち消しやすい。',
      use: 'Nice place. Kind of pricey, though.（いい店。ちょっと高いけど）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    // why: good to ← "good to go" (= ready) is a common chunk with a near sound; gonna ← "got to" reduced to "godda"
    //   heard as the future
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotto', seg: [77.7, 81.78],
      stem: 'Fill the gap: “He’s ___ go, Mike.”',
      choices: ['got to', 'good to', 'gonna'], a: 0,
      cue: '「Mike」の直前、短くつながった2語。',
      line: '*He’s got to go*, Mike.',
      said: '「辞めさせなきゃ」と言う。got to は「ガラ」のように弾む。',
      mean: 'have got to ＝ 〜しなければ。go は「職場を去る」、つまりクビ。',
      trap: 'good to go（準備OK）と音が近い。got は口を開けた「ア」、good は短い「ウ」。',
      use: 'I’ve got to go. Talk later!（もう行かなきゃ。またね）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    // why: keep an eye ← "look" taken literally (watch him); let him go ← what the staff just asked for ("He's got to
    //   go")
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'lookinto', seg: [80.3, 84.2],
      stem: 'Answering the complaints, what does Michael promise to do?',
      choices: ['Check on the problem', 'Keep a close eye on Luke', 'Let Luke go soon'], a: 0,
      cue: '「But yeah」のあとの短い約束。',
      line: 'It’s just coffee, guys. But yeah, *I’ll look into it*, okay?',
      said: '「ただのコーヒーだろ。でもまあ、調べるよ」と言う。',
      mean: 'look into ＝ 調べる。「ただのコーヒー」と軽く扱ったあとで、その場を収める決まり文句。',
      trap: 'look を「見る」と取ると「見張る」に聞こえる。look into は中身を調べる句動詞。',
      use: 'I’ll look into it and get back to you.（確認して折り返します）' },

    // R fix: K6/V2 (blind 55 %): "clearly" was an absolute only in a distractor
    // why: certain ← "I'm sure I did it" heard alone, without the "if"; doubts ← "if you asked me" heard as doubting
    //   that anyone asked
    { id: 'i2', skill: 'infer', level: 'C1', point: 'ifasked', seg: [90.65, 99.3],
      stem: 'Asked about the samples, what does Luke’s answer suggest?',
      choices: ['He doesn’t really remember sending them', 'He’s certain he sent them as asked',
                'He doubts anyone asked him to send them'], a: 0,
      cue: '答えの最初の「if」から最後まで。',
      line: 'If you asked me to do it, *I’m sure I did it*.',
      said: '「頼まれたなら、きっと送ったはず」と答える。送った記憶は語らない。',
      mean: '覚えていれば「送った」で済む。if で前提に逃げ、確信は「自分ならやるはず」という推測。',
      trap: 'I’m sure だけだと自信に聞こえる。if で始まる答えは、事実でなく仮定の合図。',
      use: 'If I said that, I didn’t mean it.（もしそう言ったなら、本気じゃなかった）' },

    // why: keep it down ← "turn off" the music suggests "be quiet", and the last word is lost; hurry it up ← "scram"
    //   heard like "scramble" (急ぐ)
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'scram', seg: [101.65, 105.45],
      stem: 'Besides turning something off, what is Luke told to do?',
      choices: ['Get out of here', 'Keep it down', 'Hurry it up'], a: 0,
      cue: '「turn off」のあと、and に続く一語。',
      line: 'Turn off the Chumbawamba and *scram*, twerp.',
      said: '「その音楽を止めて、とっとと失せろ、ガキ」と追い払う。',
      mean: 'scram ＝ さっさと出ていけ。twerp（生意気なガキ）と合わせて、かなり乱暴な言い方。',
      trap: 'scramble（あわてて動く）に似て「急げ」に聞こえやすい。scram は一語で「消えろ」。',
      use: 'Okay, kids, scram! I’m working.（ほら、あっち行って！仕事中）' },

    // R fix: V2 (blind 65 %): "someone he could trust" was a filler; now a second half-sister reading
    // why: moved away ← "cut me off from that side of the family" heard as distance, not a break; sister asked ← "his
    //   mother… my half-sister" heard as the one who arranged the job
    { id: 'g2', skill: 'gist', level: 'B2', point: 'family', seg: [121.2, 158.7],
      stem: 'Why does Michael say having Luke there means a lot to him?',
      choices: ['It reconnects him with family that cut him off', 'He’s missed his half-sister since she moved away',
                'His half-sister asked him to give Luke a job'], a: 0,
      cue: '「big deal」のあと、because で始まる理由。',
      line: '…his mother… kind of *cut me off* from that side of the family',
      said: '甥を雇った理由に、その母（異母姉）に家族の縁を切られた話をする。',
      mean: '甥を雇うのは、切れた家族とのつながりを取り戻すこと。気持ちの話。',
      trap: 'half-sister が出るので「姉に頼まれた」と取りやすい。cut me off は縁を切る、の意味。',
      use: 'It means a lot to have you here.（来てくれて本当にうれしい）' },

    // R fix: C6: moved before n2 (clip order by seg start). V2 (blind 60 %): "unrelated new story" was weak; now a fond-memory reading of the same day
    // why: fond memory ← "Anyway" heard as a light aside about their last day, the tone missed; lost touch ← "lost him"
    //   read figuratively (疎遠になる), with "in a forest" missed
    // anchor: 134.8–142.2 s "his mother… cut me off… 15 years ago"; 144.4–153.1 s "the last time I saw Luke was…" (the
    //   same 15 years); 156–158 s "Anyway, I lost him in a forest": the day he last saw the boy is the day he lost him,
    //   and "in a forest" makes "lost" literal
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'forest', reveals: ['years', 'family'], seg: [133.75, 158.7],
      stem: 'How does “I lost him in a forest” tie to what Michael said before?',
      choices: ['It hints at why his half-sister cut him off', 'It’s a fond memory from their last day together',
                'It’s a way of saying they lost touch after that'], a: 0,
      cue: '縁を切られた時期と、最後に会った日。',
      line: '…kind of *cut me off*… 15 years ago… *Anyway, I lost him in a forest*.',
      said: '縁を切られたのも甥に最後に会ったのも15年前。そこへ「ともかく、森で見失った」と言う。',
      mean: '最後に会った日に森で見失ったなら、縁を切られた訳は明らか。Anyway で流すのが笑い。',
      trap: 'Anyway で流すので、ただの思い出に聞こえる。in a forest で lose は文字どおり。',
      use: 'Anyway, the car’s fine now. Mostly.（ともかく、車はもう大丈夫。だいたい）', retired: true },

    // R fix: S4: the segment was 15.5 s; it now starts at "…the family", 0.7 s before "15 years ago"
    // why: 14 ← the correction said right after "15 years ago"; 50 ← fifteen/fifty; 5 ← "'95" heard as "five"
    { id: 'n2', skill: 'number', level: 'B2', point: 'years', seg: [140.3, 153.8], keep: true,
      stem: 'After going back and forth, how long since Michael last saw Luke?',
      choices: ['5 years', '14 years', '15 years', '50 years'], a: 2,
      cue: '最後の「so yes」のあとの数字。',
      line: '15 years ago. 14. … that was ’95, so yes, *15 years on the dot*.',
      said: '15年と言って14と直しかけ、年を計算して「やっぱりちょうど15年」と言う。',
      mean: '最後に計算し直して15年に戻る。on the dot ＝ ぴったり。',
      trap: '直した14が耳に残りやすい。言い直す話は、最後に確かめた数を取る。fifteen は語末が強い。',
      use: 'See you at nine on the dot.（9時ぴったりに会おう）' },

    // R fix: V2 (blind 60 %): "trying hard" was a filler; now a sulking reading of "What? I'm stopping it"
    // why: honestly confused ← "totally unclear" taken at face value; sulking ← "What? I'm stopping it" heard as hurt,
    //   though he goes on to "go ahead and move it"
    { id: 'at1', skill: 'attitude', level: 'C1', point: 'unclear', seg: [169.4, 180.85],
      stem: 'During the laser pointer back-and-forth, how is Luke acting?',
      choices: ['He’s playing dumb to keep his game going', 'He’s honestly confused by Michael’s orders',
                'He’s sulking after being told off in public'], a: 0,
      cue: '「Give me the pointer」への返事。',
      line: 'What? *I’m stopping it*, that’s what you said. … *totally unclear* here.',
      said: '「止めてるよ、そう言ったでしょ」と返し、「渡せ」にも「はっきりしない」と言う。',
      mean: '「渡せ」は明確な指示。分からないふりで受け流し、指示する側のせいにしている。',
      trap: 'unclear を額面どおり取ると、本当に困って聞こえる。指示自体が明確かを先に聞く。',
      use: 'Don’t play dumb with me.（とぼけないで）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    // anchor: 176.98–178.06 s right after "Give me the pointer": a question with no "do", 8 words in ≈ 1.1 s; both
    //   sources have "so you just want me to move it"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'sojust', seg: [176.5, 178.58],
      stem: 'Type Luke’s question: “___ to move it?” (5 words)', answer: 'so you just want me',
      cue: '「Give me the pointer」のすぐあと。聞こえた音を。',
      line: '*So you just want me* to move it?',
      said: '「つまり、動かしてほしいってこと？」と聞き返す。5語が弱く速く、ひと続きになる。',
      mean: 'Do を付けず、文の形のまま上がり調子で聞く確認の形。「つまり〜ね？」に近い。',
      trap: '文法どおり Do you just want と書きたくなる。書き取りは、正しい形でなく言われた音を書く。',
      use: 'So you’re not coming tonight?（じゃあ今夜は来ないってこと？）', retired: true },

    // why: point it lower ← "down" taken literally as a direction; hand it over ← "Give me the pointer" a moment before
    { id: 'ph4', skill: 'phrase', level: 'B1', point: 'powerdown', seg: [178.15, 182.28],
      stem: 'When Luke says he’ll move it, what does Michael want instead?',
      choices: ['Switch it off', 'Point it lower', 'Hand it over'], a: 0,
      cue: '動かすと言われたあとの、短い指示。',
      line: '…just *power it down*.',
      said: '「動かすんじゃない、電源を切れ」と言う。',
      mean: 'power down ＝ 電源を切る。power off とほぼ同じで、機械を止めるときの言い方。',
      trap: 'down を方向と取ると「下に向けて」になる。機械の話で power down なら、電源のこと。',
      use: 'Please power down your devices now.（電子機器の電源をお切りください）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    { id: 'x1', skill: 'dict', level: 'B2', point: 'goahead', seg: [179.55, 181.75],
      stem: 'Type what Luke says: “I’m just gonna ___ it.” (4 words)', answer: 'go ahead and move',
      cue: '「unclear here」のすぐあと。',
      line: 'I’m just gonna *go ahead and move* it.',
      said: '「じゃあ、勝手に動かしちゃうね」と言う。and は弱く「ン」だけになる。',
      mean: 'go ahead and 〜 ＝ 構わず〜する。許可を待たずに動く、という宣言。',
      trap: 'ahead と and がつながり一語に聞こえやすい。弱い and は「ン」だけ残る。',
      use: 'I’ll go ahead and order for us.（先に注文しておくね）' },

    // R fix: V2 (blind 55 %): "rushing" was a filler; now an anger reading
    // why: lost his place ← "two" twice heard as a slip of the tongue; too angry ← the "I'm not kidding" heat heard as
    //   the cause
    { id: 'i3', skill: 'infer', level: 'C1', point: 'twotwo', seg: [206, 212.4],
      stem: 'In Michael’s countdown, why does he say “two” twice?',
      choices: ['He’s stalling, hoping Luke gives in first', 'He’s lost his place and is fixing it',
                'He’s too angry to keep the count straight'], a: 0,
      cue: '「I’m not kidding」のあと、数の進み方。',
      line: 'I’m not kidding. Three. *Two. Two.* One.',
      said: '「本気だぞ」と言って数え、2を2回言ってから1まで行く。',
      mean: '本当はやりたくないので、最後の前で時間をかせぎ、甥が先に折れるのを待っている。',
      trap: '言い直しに聞こえるが、ほかの数は順に言えている。同じ数のくり返しは、ためらいの合図。',
      use: 'Last chance. I mean it this time.（最後のチャンス。今度は本気）' },

    // R fix: V2 (blind 75 %): the key was the only choice about size; all three now name a meaning and a mismatch
    // why: fine ← "capital" read in its money sense (資本); firing ← the harshest penalty at work, read into
    //   "punishment"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'capital', seg: [239, 245.7],
      stem: 'In the comment to the camera about punishment, why is the wording funny?',
      choices: ['It’s the phrase for the death penalty, far too big for this',
                'It’s a business phrase for a fine, far too dull for this',
                'It’s a polite phrase for firing, far too soft for this'], a: 0,
      cue: '「schools of thought」のあと、最後の2語。',
      line: 'There are many different schools of thought on *capital punishment*.',
      said: 'カメラに向かい「capital punishment には色々な考え方が」と言う。',
      mean: 'capital punishment は死刑。職場のお仕置きに使うには大きすぎる言葉。',
      trap: 'capital を「資本」と取るとお金の話になる。2語で一つの言い方。',
      use: 'There are different schools of thought on that.（それには色々な考え方がある）' },

    // R fix: V2/K6 (blind 80 %): "a bit" hedged a distractor only, and "What the hell was that?" (222 s, outside the
    //   segment) could defend "too far"; the stem now names the moment, and the choices are parallel
    // why: too far ← the Japanese-office frame (a boss punishing staff is shocking); sorry for him ← "your nephew" heard
    //   as sympathy, with "so lame" missed
    { id: 'at2', skill: 'attitude', level: 'B1', point: 'awesome', seg: [243.6, 250.2],
      stem: 'Right after Michael’s comment to the camera, how do the coworkers feel?',
      choices: ['Pleased; they felt Luke had it coming', 'Uneasy; they felt Michael went too far',
                'Torn; they felt a bit sorry for Luke'],
      a: 0,
      cue: '直後の短い感想と、甥についての一言。',
      line: '*That was awesome.* … Yeah, your nephew is *so lame*.',
      said: '「最高だった」「あんたの甥、本当にダサいし」と口々に言う。',
      mean: '同僚たちは喜んでいる。嫌っていた甥がこらしめられて、すっきりした気分。',
      trap: '上司が部下を罰すれば引くはず、という職場の感覚で考えやすい。感想の最初の一語で決める。',
      use: 'That was awesome! Let’s do it again.（最高！もう一回やろう）' },

    // R fix: N6: said+mean+trap was over the limit; trimmed
    // why: funny Betty posts ← "Betty White" is said three times, so it seems to be what Luke posts; watching him ←
    //   "trashing us" just before, so following him sounds like keeping watch
    { id: 'd6', skill: 'detail', level: 'B2', point: 'betty', seg: [255.15, 265.3],
      stem: 'Why does one coworker follow Luke on Twitter?',
      choices: ['Luke is a kid who doesn’t talk about Betty White', 'Luke posts funny things about Betty White',
                'Luke’s posts about the office need watching'], a: 0,
      cue: '「Everywhere I look」から最後まで。',
      line: '*Finally, a kid who’s not talking about Betty White.* Of course I follow him.',
      said: '「どこもベティ・ホワイトの話ばかり。やっとそうじゃない若者がいた」と言う。',
      mean: '理由は流行りの話をしないこと。悪口を書かれても、むしろ気に入っている。',
      trap: 'Betty White が何度も聞こえ、その投稿をしていると思いやすい。not を落とさない。',
      use: 'Finally, someone who gets it.（やっと分かってくれる人がいた）' },
  ]
};
