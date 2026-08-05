 // ==================== Daten im JS ====================
 const videoData = [
    {
      "title": "Gross Aubrig | 4K",
      "videoUrl": "https://www.youtube.com/watch?v=yR-rSXO4rmk",
      "baseTime": "15:00",
      "repeatInterval": "1d",
      "randomOffsetMinutes": { "min": -10, "max": 120 }
    },
    {
      "title": "Federispitz 1865m | Cinematic Drone 4K",
      "videoUrl": "https://www.youtube.com/watch?v=oswdAzeNdDg",
      "baseTime": "17:00",
      "repeatInterval": "1d",
      "randomOffsetMinutes": { "min": 0, "max": 30 }
    },  
    {
        "title": "Erstes Mal Hogwarts Legacy",
        "videoUrl": "https://www.youtube.com/watch?v=pM0TBYSbg6k",
        "baseTime": "17:00",
        "repeatInterval": "1d",
        "randomOffsetMinutes": { "min": 0, "max": 30 }
      },
      {
        "title": "Star Citizen Character Creator | PTU Wave 1 Showcase",
        "videoUrl": "https://www.youtube.com/watch?v=eY8wF020-zE",
        "baseTime": "17:00",
        "repeatInterval": "1d",
        "randomOffsetMinutes": { "min": 0, "max": 30 }
      },
      {
        "title": "Exploring MicroTech | Uncut version",
        "videoUrl": "https://www.youtube.com/watch?v=iJ1cbkXoncU",
        "baseTime": "17:00",
        "repeatInterval": "1d",
        "randomOffsetMinutes": { "min": 0, "max": 30 }
      },
      {
        "title": "Traya Nihilus & Malak vs Tie Interceptor Proving Grounds  #swgoh",
        "videoUrl": "https://www.youtube.com/shorts/CvNuKvvMDjw",
        "baseTime": "17:00",
        "repeatInterval": "1d",
        "randomOffsetMinutes": { "min": 0, "max": 30 }
      }   
    ];

    // ==================== Helpers ====================
    // YouTube-ID sicher aus diversen Formaten: watch, youtu.be, embed, shorts, m.youtube.com
    function getYouTubeId(url){
      try{
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./,'');
        if (host.includes('youtube.com') || host.includes('m.youtube.com')){
          // shorts
          const shorts = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]{6,})/);
          if (shorts) return shorts[1];
          // watch?v=
          const vid = u.searchParams.get('v');
          if (vid) return vid;
          // embed/{id}
          const emb = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
          if (emb) return emb[1];
        }
        if (host === 'youtu.be'){
          const p = u.pathname.split('/').filter(Boolean)[0];
          if (p) return p;
        }
      }catch(e){/* ignore */}
      return null;
    }

    const app = document.getElementById('app');

    function renderGrid(items){
      if(!Array.isArray(items) || !items.length){
        app.innerHTML = '<div class="empty">Keine Videos definiert.</div>';
        return;
      }
      const grid = document.createElement('section');
      grid.className = 'grid';

      items.forEach((item, idx)=>{
        const { title = 'Ohne Titel', videoUrl = '', baseTime, repeatInterval, randomOffsetMinutes } = item || {};
        const vid = getYouTubeId(videoUrl);

        const card = document.createElement('article');
        card.className = 'card';

        const media = document.createElement('div');
        media.className = 'thumb-wrap';

        if (vid){
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${vid}?modestbranding=1&rel=0&playsinline=1`;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          iframe.allowFullscreen = true;
          iframe.loading = 'lazy';
          media.appendChild(iframe);
        } else {
          const video = document.createElement('video');
          video.controls = true; video.preload = 'none';
          video.src = videoUrl; // unterstützt mp4/webm etc.
          media.appendChild(video);
        }

        const titleEl = document.createElement('div');
        titleEl.className = 'title';
        titleEl.textContent = title;

        const meta = document.createElement('div');
        meta.className = 'meta';
        const t = baseTime ? `<span class="badge">Start: ${baseTime}</span>` : '';
        const r = repeatInterval ? `<span class="badge">Intervall: ${repeatInterval}</span>` : '';
        const o = randomOffsetMinutes ? `<span class="badge">Offset: ${randomOffsetMinutes.min}\u2026${randomOffsetMinutes.max} min</span>` : '';
        meta.innerHTML = [t,r,o].filter(Boolean).join('');

        card.appendChild(media);
        card.appendChild(titleEl);
        if (t||r||o) card.appendChild(meta);
        grid.appendChild(card);
      });

      app.innerHTML = '';
      app.appendChild(grid);
    }

    renderGrid(videoData);

    // Basis-Controls: Wir können nur native <video> direkt steuern
    document.getElementById('playAll').addEventListener('click', ()=>{
      document.querySelectorAll('video').forEach(v=>{ try{ v.muted = true; v.play(); }catch(_){} });
    });
    document.getElementById('pauseAll').addEventListener('click', ()=>{
      document.querySelectorAll('video').forEach(v=>{ try{ v.pause(); }catch(_){} });
    });