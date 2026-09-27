assert len(script_lines)==13

def personal_script(name,role,extras):
    start(name+' · your speaking script','Individual rehearsal / Agreed speaker split',role,'Same spoken lines as master pages 4–5. Times are rehearsal targets; read actions silently.')
    y=144
    mine=[(i,row) for i,row in enumerate(script_lines) if row['speaker']==name]
    for i,row in mine:
        y=text(row['time']+' / '+row['title'],48,y,516,10,TEAL,True,12.5)+4
        spoken=row['say'].replace('. ','.<br/>') if name=='Minh' else row['say']
        y=text('“'+spoken+'”',48,y,516,9.6,leading=12.6)+4
        y=text('<b>Action:</b> '+row['operator'],48,y,516,8.3,MUTED,leading=10.5)+8
    if name=='Minh':
        card('YOUR BEST AI ANSWER','“AI reads the note. A rule picks the fix. A human taps send.”',48,355,h=75)
        heading('Know these three follow-ups',459)
        bullets([
            ('Why not prior auth?', 'The earlier pharmacy reject is 75. Gemini classifies the later hub contact note, whose expected reason is unable to reach.'),
            ('What does unknown mean?', 'The backend returns null for uncertain, invalid, rejected or timed-out classification. It does not invent a reason.'),
            ('What changed?', 'Otezla and Humira now have verified cached labels. Humira does not gain audio or a live visit trigger from that change.')
        ],496)
    elif name=='Khadim':
        card('WALK-UP / ABOUT 10 SECONDS','“Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.”',48,max(y+8,529),h=88)
    small('Questions: Khadim — buyer, market, partner fit. Vinh — build, data flow, polling, watch. Minh — AI and labels; Vinh supports. Keep optional features out if they risk the core proof.',48,690)

# RENDER PERSONAL SCRIPTS
personal_script('Khadim','Open, introduce the user and product, hand over to Vinh, then close. Lead business questions.',[])
personal_script('Vinh','Drive the coordinator, doctor and patient demo. Lead data-flow, build and watch questions.',[])
personal_script('Minh','Speak for about 20 seconds in short sentences. Lead AI and label questions; Vinh supports.',[])
