import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Pagination } from 'swiper/modules'
import './MusicPlayer.css'

interface Props {
  onBack: () => void
}

interface Song {
  title: string
  name: string
  source: string
  cover: string
}

const songs: Song[] = [
  {
    title: 'Redemption',
    name: 'Besomorph & Coopex',
    source:
      'https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Besomorph-Coopex-Redemption.mp3',
    cover:
      'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/398875d0-9b9e-494a-8906-210aa3f777e0',
  },
  {
    title: "What's The Problem?",
    name: 'OSKI',
    source:
      'https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/OSKI-Whats-The-Problem.mp3',
    cover:
      'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/810d1ddc-1168-4990-8d43-a0ffee21fb8c',
  },
  {
    title: 'Control',
    name: 'Unknown Brain x Rival',
    source:
      'https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Unknown-BrainxRival-Control.mp3',
    cover:
      'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/7bd23b84-d9b0-4604-a7e3-872157a37b61',
  },
]

export default function MusicPlayer({ onBack }: Props) {
  const [activeNav, setActiveNav] = useState(0)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [progress, setProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)
  const rotatingImageRef = useRef<HTMLImageElement>(null)
  const rotationIntervalRef = useRef<number | null>(null)
  const containerRefs = useRef<(HTMLDivElement | null)[]>([])

  // Drag-to-scroll functionality
  useEffect(() => {
    containerRefs.current.forEach((container) => {
      if (!container) return

      let isDragging = false
      let startX = 0
      let scrollLeft = 0

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true
        startX = e.pageX - container.offsetLeft
        scrollLeft = container.scrollLeft
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
        const x = e.pageX - container.offsetLeft
        const step = (x - startX) * 0.6
        container.scrollLeft = scrollLeft - step
      }

      const handleMouseUp = () => {
        isDragging = false
      }

      const handleMouseLeave = () => {
        isDragging = false
      }

      container.addEventListener('mousedown', handleMouseDown)
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseup', handleMouseUp)
      container.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        container.removeEventListener('mousedown', handleMouseDown)
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseup', handleMouseUp)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
    })
  }, [])

  // Rotation animation
  useEffect(() => {
    if (isPlaying) {
      rotationIntervalRef.current = window.setInterval(() => {
        setCurrentRotation((prev) => prev + 1)
      }, 50)
    } else {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current)
        rotationIntervalRef.current = null
      }
    }

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current)
      }
    }
  }, [isPlaying])

  // Update rotation transform
  useEffect(() => {
    if (rotatingImageRef.current) {
      rotatingImageRef.current.style.transform = `rotate(${currentRotation}deg)`
    }
  }, [currentRotation])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      // Ready to play
    }

    const handleTimeUpdate = () => {
      if (!audio.paused) {
        setProgress(audio.currentTime)
      }
    }

    const handleEnded = () => {
      const nextIndex = (currentSongIndex + 1) % songs.length
      setCurrentSongIndex(nextIndex)
      // Auto-play next song
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
          setIsPlaying(true)
        }
      }, 100)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentSongIndex])

  // Update song when index changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = songs[currentSongIndex].source
    audio.load()
  }, [currentSongIndex])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setProgress(newTime)

    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleForward = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length
    setCurrentSongIndex(nextIndex)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }, 100)
  }

  const handleBackward = () => {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length
    setCurrentSongIndex(prevIndex)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }, 100)
  }

  const currentSong = songs[currentSongIndex]

  return (
    <div className="music-player-page">
      <button className="mp-back-btn" onClick={onBack}>
        <i className="fa fa-arrow-left"></i>
      </button>

      <main>
        <nav className="main-menu">
          <div>
            <div className="user-info">
              <img
                src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/37e5ccfa-f9ee-458b-afa2-dcd85b495e4e"
                alt="user"
              />
              <p>Jane Wilson</p>
            </div>
            <ul>
              {['Discover', 'Trending', 'Album', 'Playlist', 'Favorites'].map((item, idx) => {
                const icons = ['fa-map', 'fa-arrow-trend-up', 'fa-compact-disc', 'fa-circle-play', 'fa-heart']
                return (
                  <li key={idx} className={`nav-item ${activeNav === idx ? 'active' : ''}`}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveNav(idx) }}>
                      <i className={`fa ${icons[idx]} nav-icon`}></i>
                      <span className="nav-text">{item}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <ul>
            {['Profile', 'Settings', 'Logout'].map((item, idx) => {
              const icons = ['fa-user', 'fa-gear', 'fa-right-from-bracket']
              return (
                <li key={idx} className="nav-item">
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    <i className={`fa ${icons[idx]} nav-icon`}></i>
                    <span className="nav-text">{item}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className="content">
          <div className="left-content">
            <div className="slider-container">
              <h1>Popular Playlist</h1>
              <Swiper
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                loop={true}
                speed={600}
                slidesPerView="auto"
                coverflowEffect={{
                  rotate: 10,
                  stretch: 120,
                  depth: 200,
                  modifier: 1,
                  slideShadows: false,
                }}
                pagination={{ clickable: true }}
                modules={[EffectCoverflow, Pagination]}
                className="swiper"
              >
                {[
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/95b52c32-f5da-4fe6-956d-a5ed118bbdd2', name: 'Midnight Moods' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/6ddf81f5-2689-4f34-bf80-a1e07f14621c', name: 'Party Starters' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/ab52d9d0-308e-43e0-a577-dce35fedd2a3', name: 'Relaxing Tones' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/20c8fdd5-9f4a-4917-ae90-0239a52e8334', name: 'Smooth Jazz Journey' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/df461a99-2fb3-4d55-ac16-2e0c6dd783e1', name: 'Uplifting Rhythms' },
                ].map((playlist, idx) => (
                  <SwiperSlide key={idx}>
                    <img src={playlist.img} alt={playlist.name} />
                    <div className="slide-overlay">
                      <h2>{playlist.name}</h2>
                      <button>
                        Listen Now <i className="fa-solid fa-circle-play"></i>
                      </button>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="artists">
              <h1>Featured Artists</h1>
              <div className="artist-container containers" ref={(el) => { containerRefs.current[0] = el }}>
                {[
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/c8feaa0f-6ae7-4c69-bb7d-4a11de76b4f5', name: 'Taylor Swift' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/bf80314e-5a02-4702-bb64-eae8c113c417', name: 'The Weeknd' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/e4576af8-0e84-4343-8f90-7a01acb9c8b7', name: 'Dua Lipa' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/d8eb2888-1e74-4117-82d7-833ad29e3cc1', name: 'Jimin' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/f23adc16-11d7-41dc-af6a-191e03a81603', name: 'Alicia Keys' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/f511c102-3217-4bea-bede-8be23b969bd8', name: 'Maroon 5' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/9a8bd237-b525-43e6-a37c-daaac39db8ce', name: 'Imagine Dragons' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/99452c85-26f4-4ccd-b439-7d1bd3875634', name: 'Billie Eilish' },
                ].map((artist, idx) => (
                  <div key={idx} className="artist">
                    <div className="artist-img-container">
                      <img src={artist.img} alt={artist.name} />
                    </div>
                    <p>{artist.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="albums">
              <h1>Recommended Albums</h1>
              <div className="album-container containers" ref={(el) => { containerRefs.current[1] = el }}>
                {[
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/74c4f0f9-d73e-4737-83fa-ea4afe392229', title: 'Views', artist: 'Drake' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/d3a0bac0-fdb4-467e-bdf5-f3f415928f24', title: 'Speak Now', artist: 'Taylor Swift' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/85521a12-cc46-4b9f-a742-21ba407ebd5e', title: 'Born to Die', artist: 'Lana Del Rey' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/4e7bf466-7fa5-4dad-b628-5bca12833b64', title: 'Endless Summer Vacation', artist: 'Miley Cyrus' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/f01f546a-7ab7-4e90-acb9-1c1e817b676d', title: 'The Dark Side of The Moon', artist: 'Pink Floyd' },
                ].map((album, idx) => (
                  <div key={idx} className="album">
                    <div className="album-frame">
                      <img src={album.img} alt={album.title} />
                    </div>
                    <div>
                      <h2>{album.title}</h2>
                      <p>{album.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-content">
            <div className="recommended-songs">
              <h1>Recommended Songs</h1>
              <div className="song-container">
                {[
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/ea61baa7-9c4b-4f43-805e-81de5fc8aa2b', title: 'Blank Space', artist: 'Taylor Swift', time: '4:33' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/6f72f702-c049-46fe-af76-a3b188b9a909', title: 'One Dance', artist: 'Drake', time: '4:03' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/ad2e664a-3ab9-4f30-933a-623e26999030', title: 'Pawn It All', artist: 'Alicia Keys', time: '3:10' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/666e065b-eb53-4320-a580-30e266370955', title: 'Lose Control', artist: 'Teddy Swims', time: '3:30' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/619ed17f-5df2-4d32-a419-78f120a1aa5c', title: 'Be The One', artist: 'Dua Lipa', time: '3:24' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/0ed3f51d-b769-4256-a4dd-8f35b12a1690', title: 'Delicate', artist: 'Taylor Swift', time: '3:54' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/33779e1a-55f9-402a-b004-002395d0fbf1', title: 'Last Christmas', artist: 'Wham!', time: '4:39' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/96bc0648-51f9-46ab-a426-766c6bc93d80', title: 'Paradise', artist: 'Coldplay', time: '4:20' },
                  { img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/885b67a7-1816-4235-9dd3-5d879a202728', title: 'Easy On Me', artist: 'Adele', time: '3:45' },
                ].map((song, idx) => (
                  <div key={idx} className="song">
                    <div className="song-img">
                      <img src={song.img} alt={song.title} />
                      <div className="overlay">
                        <i className="fa-solid fa-play"></i>
                      </div>
                    </div>
                    <div className="song-title">
                      <h2>{song.title}</h2>
                      <p>{song.artist}</p>
                    </div>
                    <span>{song.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="music-player">
              <div className="album-cover">
                <img
                  ref={rotatingImageRef}
                  src={currentSong.cover}
                  id="rotatingImage"
                  alt={currentSong.title}
                />
                <span className="point"></span>
              </div>

              <h2>{currentSong.title}</h2>
              <p>{currentSong.name}</p>

              <audio ref={audioRef} id="song">
                <source src={currentSong.source} type="audio/mpeg" />
              </audio>

              <input
                type="range"
                value={progress}
                max={audioRef.current?.duration || 0}
                id="progress"
                onChange={handleProgressChange}
              />

              <div className="controls">
                <button className="backward" onClick={handleBackward}>
                  <i className="fa-solid fa-backward"></i>
                </button>
                <button className="play-pause-btn" onClick={togglePlayPause}>
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} id="controlIcon"></i>
                </button>
                <button className="forward" onClick={handleForward}>
                  <i className="fa-solid fa-forward"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
