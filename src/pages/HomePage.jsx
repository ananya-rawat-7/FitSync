import { Activity, ArrowDown, ArrowUpRight, CalendarDays, ChartNoAxesColumnIncreasing, HeartHandshake, ListChecks, Move, Play, Salad, Sparkles, Sun, Wind, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const templates = [
  { name: "Full Body", category: "STRENGTH", level: "Beginner", minutes: 30, moves: 6, image: "workout-image-1", icon: "strength" },
  { name: "Upper Body", category: "STRENGTH", level: "Intermediate", minutes: 25, moves: 5, image: "workout-image-2", icon: "strength" },
  { name: "Lower Body", category: "STRENGTH", level: "Intermediate", minutes: 35, moves: 6, image: "workout-image-3", icon: "activity" },
  { name: "Core", category: "CORE", level: "Beginner", minutes: 18, moves: 4, image: "workout-image-4", icon: "core" },
  { name: "Cardio", category: "CARDIO", level: "All levels", minutes: 22, moves: 5, image: "workout-image-5", icon: "cardio" },
  { name: "Mobility", category: "RECOVERY", level: "All levels", minutes: 15, moves: 5, image: "workout-image-6", icon: "mobility" },
];

function TemplateIcon({ kind }) {
  if (kind === "cardio") return <Activity />;
  if (kind === "mobility") return <Wind />;
  if (kind === "core") return <span className="template-symbol">◎</span>;
  return <span className="template-symbol">↗</span>;
}

export default function HomePage() {
  return (
    <main>
      <section className="hero section-wrap" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> YOUR FITNESS, YOUR WAY.</p>
          <h1>TRAIN SMART.<br />MOVE BETTER.<br /><span>FEEL STRONGER.</span></h1>
          <p className="hero-description">FitSync helps you plan workouts, track your sessions, understand your progress and build healthy fitness habits — all in one place.</p>
          <div className="hero-actions"><Link className="button" to="/register">Start your first session <ArrowUpRight /></Link><a className="button button-outline" href="#how-it-works">See how it works <Play /></a></div>
          <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>A</span><span>M</span></div><p><strong>A little progress, every day.</strong><br />Built around real life, not perfection.</p></div>
        </div>
        <div className="hero-visual" aria-label="Athlete training with a dumbbell">
          <img className="hero-photo" src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=85" alt="Athlete focused on a strength workout" />
          <div className="photo-tint" /><div className="visual-label"><span className="visual-pulse" /><span>YOUR NEXT REP<br /><strong>STARTS HERE</strong></span><ArrowUpRight /></div>
          <div className="heart-card"><div className="heart-card-top"><span className="heart-icon"><Activity /></span><span>HEART RATE</span><strong>128 <small>BPM</small></strong></div><div className="heart-wave" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div><p>IN THE ZONE <ArrowUpRight /></p></div>
          <div className="session-chip"><span className="session-chip-icon"><Activity /></span><span><small>TODAY'S FOCUS</small><strong>Full body strength</strong></span><ArrowUpRight /></div>
          <span className="hero-index">01 <span>/ 04</span></span>
        </div>
        <a className="scroll-cue" href="#how-it-works"><span /> SCROLL TO EXPLORE</a>
      </section>

      <section className="how-section section-wrap" id="how-it-works">
        <div className="section-heading"><div><p className="eyebrow">A ROUTINE THAT WORKS FOR YOU</p><h2>GOOD FITNESS.<br /><span>NO GUESSWORK.</span></h2></div><p className="section-aside">A few thoughtful tools make it easier to show up, stay consistent and feel good about the work you put in.</p></div>
        <div className="steps-grid">
          <article className="step"><span className="step-number">01</span><CalendarDays /><h3>PLAN YOUR WEEK</h3><p>Choose workouts that fit your schedule and create a simple weekly routine.</p><a href="#workouts" aria-label="Explore workouts"><ArrowUpRight /></a></article>
          <article className="step"><span className="step-number">02</span><ListChecks /><h3>LOG YOUR SESSION</h3><p>Record your workouts and review completed sessions.</p><a href="#workouts" aria-label="Explore workouts"><ArrowUpRight /></a></article>
          <article className="step"><span className="step-number">03</span><ChartNoAxesColumnIncreasing /><h3>TRACK YOUR PROGRESS</h3><p>Understand your activity, consistency and progress over time.</p><a href="#progress" aria-label="See your progress"><ArrowUpRight /></a></article>
          <article className="step"><span className="step-number">04</span><HeartHandshake /><h3>BUILD HEALTHY HABITS</h3><p>Get simple nutrition and recovery guidance to support your routine.</p><a href="#nutrition" aria-label="Explore nutrition"><ArrowUpRight /></a></article>
        </div>
      </section>

      <section className="styles-section" id="training-styles"><div className="section-wrap">
        <div className="section-heading section-heading-light"><div><p className="eyebrow">FIND YOUR KIND OF STRONG</p><h2>PICK YOUR<br /><span>TRAINING STYLE.</span></h2></div><Link className="text-link text-link-light" to="/workouts">ALL WORKOUTS <ArrowUpRight /></Link></div>
        <div className="style-grid">
          <Link className="style-card style-card-cardio" to="/workouts"><span className="style-index">01 / MOVE</span><span className="style-icon"><Activity /></span><span className="style-card-bottom"><span><strong>CARDIO</strong><small>Build endurance and keep your body active.</small></span><ArrowUpRight /></span></Link>
          <Link className="style-card style-card-strength" to="/workouts"><span className="style-index">02 / BUILD</span><span className="style-icon"><Activity /></span><span className="style-card-bottom"><span><strong>STRENGTH</strong><small>Improve strength with structured resistance training.</small></span><ArrowUpRight /></span></Link>
          <Link className="style-card style-card-mobility" to="/workouts"><span className="style-index">03 / RESET</span><span className="style-icon"><Move /></span><span className="style-card-bottom"><span><strong>MOBILITY</strong><small>Stretch, move comfortably and support recovery.</small></span><ArrowUpRight /></span></Link>
          <Link className="style-card style-card-hiit" to="/workouts"><span className="style-index">04 / GO</span><span className="style-icon"><Zap /></span><span className="style-card-bottom"><span><strong>HIIT</strong><small>Short, energetic interval-based workouts.</small></span><ArrowUpRight /></span></Link>
        </div>
      </div></section>

      <section className="workouts-section section-wrap" id="workouts">
        <div className="section-heading"><div><p className="eyebrow">A GOOD PLACE TO START</p><h2>FIND YOUR<br /><span>WORKOUT.</span></h2></div><div className="workout-heading-right"><p>Pick a session that feels right for today. Every workout is a fresh start.</p><Link className="text-link" to="/workouts">BROWSE SESSIONS <ArrowDown /></Link></div></div>
        <div className="workout-grid" id="workouts-grid">{templates.map((workout) => (
          <Link className="workout-card" to={`/workouts?name=${encodeURIComponent(workout.name)}`} key={workout.name}>
            <div className={`workout-image ${workout.image}`}><span className="workout-category">{workout.category}</span><span className="workout-img-icon"><TemplateIcon kind={workout.icon} /></span></div>
            <div className="workout-info"><div><h3>{workout.name}</h3><p><span>{workout.level}</span><b /><span>{workout.minutes} min</span><b /><span>{workout.moves} moves</span></p></div><span className="workout-open" aria-hidden="true"><ArrowUpRight /></span></div>
          </Link>
        ))}</div>
      </section>

      <section className="progress-section" id="progress"><div className="section-wrap progress-layout">
        <div className="progress-copy"><p className="eyebrow">PROGRESS, NOT PRESSURE</p><h2>SHOW UP.<br /><span>SEE IT ADD UP.</span></h2><p>Every session counts. Keep an eye on your activity and celebrate the consistency you’re building, one week at a time.</p><Link className="button" to="/dashboard">View your progress <ArrowUpRight /></Link><div className="progress-note"><Sparkles /><span><strong>Consistency looks good on you.</strong><br />Small steps make a strong routine.</span></div></div>
        <Link className="dashboard-preview" to="/dashboard"><span className="dashboard-overline">YOUR ACTIVITY</span><strong>A steady week.</strong><span>Log in to see your personal workout history and progress.</span><Activity /></Link>
      </div></section>

      <section className="nutrition-section section-wrap" id="nutrition"><div className="section-heading"><div><p className="eyebrow">FUEL FOR THE FEELING</p><h2>EAT TO SUPPORT<br /><span>YOUR TRAINING.</span></h2></div><p className="section-aside">Good nutrition is about care, not rules. A few balanced basics can support the way you move and recover.</p></div>
        <div className="nutrition-grid">
          <article className="nutrition-card nutrition-meals"><div className="nutrition-icon"><Salad /></div><span className="nutrition-count">01 / NOURISH</span><h3>Balanced meals</h3><p>Build satisfying plates with a mix of colorful produce, grains and foods you enjoy.</p></article>
          <article className="nutrition-card nutrition-hydration"><div className="nutrition-icon"><Activity /></div><span className="nutrition-count">02 / REFRESH</span><h3>Hydration</h3><p>Keep water close and drink regularly, especially around your activity.</p></article>
          <article className="nutrition-card nutrition-protein"><div className="nutrition-icon"><HeartHandshake /></div><span className="nutrition-count">03 / REPLENISH</span><h3>Protein & nutrients</h3><p>Varied foods help your body get the nutrients it needs to feel its best.</p></article>
          <article className="nutrition-card nutrition-recovery"><div className="nutrition-icon"><Sun /></div><span className="nutrition-count">04 / RESTORE</span><h3>Recovery</h3><p>Rest, sleep and gentle movement are all part of a well-rounded routine.</p></article>
        </div>
      </section>

      <section className="about-section" id="about"><div className="about-image"><img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1100&q=85" alt="Person stretching during a mindful movement session" loading="lazy" /><span className="about-image-tag"><Sun /> MADE FOR REAL LIFE</span></div><div className="about-copy"><p className="eyebrow">A HEALTHIER KIND OF HUSTLE</p><h2>FITNESS SHOULD<br />FEEL <span>SIMPLE.</span></h2><p>FitSync is designed to help you organize workouts, monitor your progress and develop sustainable fitness habits. No all-or-nothing plans. Just a clearer way to make movement part of your life.</p><a className="text-link" href="#how-it-works">A LITTLE MORE ABOUT US <ArrowUpRight /></a><div className="about-signoff">YOUR PACE. YOUR PROGRESS. <span>✳</span></div></div></section>
    </main>
  );
}
