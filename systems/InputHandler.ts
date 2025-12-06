
// Declare global MediaPipe types
declare global {
  interface Window {
    FaceMesh: any;
  }
}

interface HandResult {
    index: number; // 0 for Nose
    x: number;
    y: number;
}

export class InputHandler {
    private video: HTMLVideoElement;
    private faceMesh: any;
    private isProcessing: boolean = false;
    private animationFrameId: number = 0;
    private onCursorDetected: (results: HandResult[]) => void;
    private width: number;
    private height: number;
    private isCleanedUp: boolean = false;

    // Sensitivity Config
    // Multiplier: How much head movement amplifies cursor movement
    // Center Threshold: The "dead zone" or offset
    private readonly SENSITIVITY_X = 2.5; 
    private readonly SENSITIVITY_Y = 2.0;

    constructor(
        videoElement: HTMLVideoElement, 
        width: number, 
        height: number,
        onCursorDetected: (results: HandResult[]) => void
    ) {
        this.video = videoElement;
        this.width = width;
        this.height = height;
        this.onCursorDetected = onCursorDetected;
    }

    updateDimensions(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    async initialize() {
        if (this.isCleanedUp) return;

        if (!window.FaceMesh) {
            console.warn("MediaPipe FaceMesh not loaded, retrying...");
            setTimeout(() => this.initialize(), 500);
            return;
        }

        this.faceMesh = new window.FaceMesh({locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }});

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults(this.handleResults);

        await this.startCamera();
        
        // Critical Check: If cleanup happened while camera was starting, stop here
        if (this.isCleanedUp) return;

        this.processLoop();
    }

    private handleResults = (results: any) => {
        const landmarks = results.multiFaceLandmarks;
        
        const detected: HandResult[] = [];

        if (landmarks && landmarks.length > 0) {
            const face = landmarks[0];
            // Landmark 4 is the tip of the nose
            const nose = face[4]; 
            
            // --- Non-Linear Mapping "Amplifier" ---
            // Raw nose.x is usually 0.4 to 0.6. We want to map that small range to 0.0 to 1.0
            
            // 1. Center the coordinate (0.5 is center)
            let xCentered = (1 - nose.x) - 0.5; // Mirroring included
            let yCentered = nose.y - 0.5;

            // 2. Amplify
            xCentered *= this.SENSITIVITY_X;
            yCentered *= this.SENSITIVITY_Y;

            // 3. Shift back to 0..1 range
            let finalX = xCentered + 0.5;
            let finalY = yCentered + 0.5;

            // 4. Clamp
            finalX = Math.max(0, Math.min(1, finalX));
            finalY = Math.max(0, Math.min(1, finalY));

            const targetX = finalX * this.width;
            const targetY = finalY * this.height;
            
            detected.push({ index: 0, x: targetX, y: targetY });
        }
        this.onCursorDetected(detected);
    };

    private async startCamera() {
         if (this.isCleanedUp) return;
         try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 }
                }
            });
            
            if (this.isCleanedUp) {
                // If cleaned up during request, stop tracks immediately
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            this.video.srcObject = stream;
            await this.video.play();
         } catch (err) {
             console.error("Camera init failed:", err);
             // alert("无法访问摄像头"); // Suppress alert to avoid annoyance in loop
         }
    }

    private processLoop = async () => {
        if (this.isCleanedUp) return;

        if (this.video && this.faceMesh && !this.isProcessing && this.video.readyState >= 2) {
            this.isProcessing = true;
            try {
                await this.faceMesh.send({ image: this.video });
            } catch(e) { 
                console.error("Tracking error", e); 
            }
            this.isProcessing = false;
        }
        this.animationFrameId = requestAnimationFrame(this.processLoop);
    }

    cleanup() {
        this.isCleanedUp = true;
        cancelAnimationFrame(this.animationFrameId);
        if (this.video && this.video.srcObject) {
            (this.video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
        if (this.faceMesh) {
            this.faceMesh.close();
        }
    }
}
