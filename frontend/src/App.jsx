import { useState, useEffect, useRef } from 'react';

// Simple debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function App() {
  const [word, setWord] = useState('');
  const [dictionary, setDictionary] = useState(() => {
    return localStorage.getItem('scrabble-dictionary') || 'UK';
  });
  const [isValid, setIsValid] = useState(null); // null = typing/empty, true = valid, false = invalid
  const [isChecking, setIsChecking] = useState(false);
  
  const debouncedWord = useDebounce(word, 300);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('scrabble-dictionary', dictionary);
  }, [dictionary]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const cleanWord = debouncedWord.trim().toUpperCase();
    
    if (cleanWord.length < 2) {
      setIsValid(null);
      setIsChecking(false);
      return;
    }
    
    if (!/^[A-Z]{2,15}$/.test(cleanWord)) {
      setIsValid(false);
      setIsChecking(false);
      return;
    }

    let isMounted = true;
    setIsChecking(true);

    fetch(`/api/check/${dictionary}/${cleanWord}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          if (data.error) {
            setIsValid(false);
          } else {
            setIsValid(data.isValid);
          }
          setIsChecking(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setIsValid(null);
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedWord, dictionary]);

  const handleInputChange = (e) => {
    setWord(e.target.value);
    // Reset status while typing if word length changes
    if (isValid !== null) {
      setIsValid(null);
    }
  };

  useEffect(() => {
    if (isValid === true) {
      // Double tap haptic for valid word
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
    } else if (isValid === false && debouncedWord.length >= 2) {
      // Single thud haptic for invalid word
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  }, [isValid, debouncedWord]);

  let bgColorClass = 'bg-slate-900';
  if (isValid === true) bgColorClass = 'bg-emerald-600';
  if (isValid === false && debouncedWord.length >= 2) bgColorClass = 'bg-rose-600';

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center transition-colors duration-500 ease-in-out ${bgColorClass} text-white p-4 pt-safe pb-safe`}>
      
      <div className="absolute top-0 left-0 right-0 p-6 pt-safe flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight opacity-90">
          Sistermi's Scrabble Checker
        </h1>
        
        <div className="flex bg-black/20 rounded-lg p-1 backdrop-blur-sm">
          <button 
            onClick={() => { setDictionary('US'); setIsValid(null); }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${dictionary === 'US' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            US English
          </button>
          <button 
            onClick={() => { setDictionary('UK'); setIsValid(null); }}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${dictionary === 'UK' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            UK English
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center">
        <label className="text-sm md:text-base font-bold tracking-[0.2em] text-white/50 mb-4 uppercase">
          Type a word
        </label>
        <input
          ref={inputRef}
          type="text"
          value={word}
          onChange={handleInputChange}
          className="w-full text-5xl md:text-8xl font-black text-center bg-transparent border-b-4 border-white/20 focus:border-white outline-none py-4 uppercase tracking-widest transition-colors"
          spellCheck="false"
          autoComplete="off"
          inputMode="text"
        />
        
        <div className="h-24 mt-8 flex items-center justify-center">
          {isChecking ? (
            <div className="text-2xl md:text-3xl font-bold opacity-80 animate-pulse">
              Checking...
            </div>
          ) : isValid === true ? (
            <div className="text-4xl md:text-6xl font-black tracking-wider drop-shadow-lg">
              VALID
            </div>
          ) : isValid === false && debouncedWord.length >= 2 ? (
            <div className="text-4xl md:text-6xl font-black tracking-wider drop-shadow-lg">
              INVALID
            </div>
          ) : (
             <div className="text-lg md:text-xl font-medium opacity-50">
              {debouncedWord.length === 1 ? 'Keep typing...' : ''}
            </div>
          )}
        </div>
      </div>

      <footer className="absolute bottom-0 pb-safe opacity-40 text-sm font-medium tracking-wide mb-6">
        Built with love by Lanre
      </footer>

    </div>
  );
}

export default App;
