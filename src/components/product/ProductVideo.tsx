import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useRef, useState, useEffect, MouseEvent } from 'react';

interface ProductVideoProps {
    videoUrl?: string;
    poster?: string;
}

/**
 * Componente de player de vídeo para produtos
 * Com controles de play/pause e volume
 */
export default function ProductVideo({ videoUrl, poster }: ProductVideoProps): React.ReactElement | null {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);

    useEffect(() => {
        // Attempt auto-play when component mounts
        if (videoRef.current) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.warn("Autoplay prevented:", error);
                setIsPlaying(false);
            });
        }
    }, []);

    const togglePlay = (e: MouseEvent<HTMLButtonElement | HTMLVideoElement>): void => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    if (!videoUrl) return null;

    return (
        <div className="relative w-full aspect-[4/5] md:aspect-square bg-black rounded-xl overflow-hidden group shadow-lg border border-slate-100">
            <video
                ref={videoRef}
                src={videoUrl}
                poster={poster}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
            >
                <track kind="captions" src="" label="Português" default />
            </video>

            {/* Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4">
                <div className="flex items-center justify-between pointer-events-auto">
                    <button
                        onClick={togglePlay}
                        className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
                        aria-label={isPlaying ? "Pausar" : "Tocar"}
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
                        aria-label={isMuted ? "Ativar som" : "Mudo"}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Status Badge (if autoplaying muted) */}
            <div className="absolute top-3 right-3 pointer-events-none">
                <span className="bg-lyvest-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    Vídeo
                </span>
            </div>

            {/* Central Play Button (if paused) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center p-4 shadow-xl border border-white/30">
                        <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
}
