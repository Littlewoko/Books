"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { PointerLockControls, Html } from "@react-three/drei";
import { Book } from "@/app/lib/classes/book";
import { useRouter } from "next/navigation";
import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

const SPINE_HEIGHT = 1.4;
const SPINE_DEPTH = 0.7;
const SPINE_WIDTH = 0.14;
const SHELF_DEPTH = 0.8;
const SHELF_HEIGHT = 0.04;
const SHELF_GAP = 1.7;
const BOOKS_PER_SHELF = 16;
const MAX_SHELVES = 2;
const MAX_BOOKS_PER_CASE = BOOKS_PER_SHELF * MAX_SHELVES;
const BOOKCASE_WIDTH = BOOKS_PER_SHELF * (SPINE_WIDTH + 0.02) + 0.3;
const CASE_SPACING = BOOKCASE_WIDTH + 0.4;
const AISLE_HALF = 4;

const spineColorHexes = [
    "#5c2d0e", "#1a3a1a", "#6b1c1c", "#1c1c4b", "#4a3728",
    "#0e3d3d", "#3b1a4b", "#5c1a2a", "#1a4040", "#1a3050",
    "#3d3530", "#2d2d2d", "#4b3a1a", "#2a1a3b", "#3a1a1a",
    "#1a2a3a", "#4b4020", "#2d1a0e", "#0e2d2d", "#3a2a1a",
];

function getSpineColorHex(book: Book): string {
    if (book.spineColor) return book.spineColor;
    let hash = 0;
    for (let i = 0; i < book.title.length; i++) {
        hash = book.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return spineColorHexes[Math.abs(hash) % spineColorHexes.length];
}

function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function getHeightVariation(title: string): number {
    let h = 0;
    for (let i = 0; i < title.length; i++) h += title.charCodeAt(i);
    return SPINE_HEIGHT * (0.85 + (h % 15) / 100);
}

// Generate a spine texture on an offscreen canvas
// The texture is drawn "upright" — title runs bottom-to-top when applied to the front face of the spine
function generateSpineTexture(title: string, author: string, bgColor: string): THREE.CanvasTexture {
    const texW = 64;
    const texH = 512;
    const canvas = document.createElement("canvas");
    canvas.width = texW;
    canvas.height = texH;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, texW, texH);

    // Subtle edge lines
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, 3, texH);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(texW - 1, 0, 1, texH);

    // Text color based on background brightness
    const light = isLightColor(bgColor);
    const textColor = light ? "rgba(40,30,20,0.85)" : "rgba(255,241,214,0.85)";
    const subColor = light ? "rgba(40,30,20,0.45)" : "rgba(255,241,214,0.45)";

    // Draw text rotated — we rotate the canvas context so text reads bottom-to-top
    ctx.save();
    ctx.translate(texW / 2, texH / 2);
    ctx.rotate(-Math.PI / 2);

    // Now "width" is texH and "height" is texW in the rotated space
    const maxTextWidth = texH - 20;

    // Title
    ctx.fillStyle = textColor;
    ctx.font = "bold 22px Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    let displayTitle = title;
    while (ctx.measureText(displayTitle).width > maxTextWidth * 0.65 && displayTitle.length > 3) {
        displayTitle = displayTitle.slice(0, -1);
    }
    if (displayTitle !== title) displayTitle += "...";

    ctx.fillText(displayTitle, -maxTextWidth / 2, -6);

    // Author
    ctx.fillStyle = subColor;
    ctx.font = "16px Georgia, serif";
    let displayAuthor = author;
    while (ctx.measureText(displayAuthor).width > maxTextWidth * 0.3 && displayAuthor.length > 3) {
        displayAuthor = displayAuthor.slice(0, -1);
    }
    if (displayAuthor !== author) displayAuthor += "...";

    ctx.fillText(displayAuthor, -maxTextWidth / 2, 14);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

interface BookcaseLayout {
    genre: string;
    books: Book[];
    position: [number, number, number];
    rotation: number;
}

interface SpineData {
    bookId: number;
    bookTitle: string;
    bookAuthor: string;
    position: THREE.Vector3;
    height: number;
    texture: THREE.CanvasTexture;
}

function buildLayouts(books: Book[]): BookcaseLayout[] {
    const map = new Map<string, Book[]>();
    for (const book of books) {
        const genre = (book.genre || "Uncategorised").trim();
        if (!map.has(genre)) map.set(genre, []);
        map.get(genre)!.push(book);
    }
    const genres = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

    const leftCases: { genre: string; books: Book[] }[] = [];
    const rightCases: { genre: string; books: Book[] }[] = [];
    let currentSide = leftCases;

    for (const [genre, genreBooks] of genres) {
        const chunks: { genre: string; books: Book[] }[] = [];
        for (let i = 0; i < genreBooks.length; i += MAX_BOOKS_PER_CASE) {
            const chunk = genreBooks.slice(i, i + MAX_BOOKS_PER_CASE);
            const label = chunks.length === 0 ? genre : `${genre} (cont.)`;
            chunks.push({ genre: label, books: chunk });
        }
        currentSide.push(...chunks);
        currentSide = currentSide === leftCases ? rightCases : leftCases;
    }

    const layouts: BookcaseLayout[] = [];
    const totalCols = Math.max(leftCases.length, rightCases.length);
    const offsetX = ((totalCols - 1) * CASE_SPACING) / 2;

    for (let i = 0; i < leftCases.length; i++) {
        layouts.push({
            ...leftCases[i],
            position: [i * CASE_SPACING - offsetX, 0, -AISLE_HALF],
            rotation: 0,
        });
    }
    for (let i = 0; i < rightCases.length; i++) {
        layouts.push({
            ...rightCases[i],
            position: [i * CASE_SPACING - offsetX, 0, AISLE_HALF],
            rotation: Math.PI,
        });
    }

    return layouts;
}

function buildSpineData(layouts: BookcaseLayout[]): SpineData[] {
    const spines: SpineData[] = [];
    for (const layout of layouts) {
        const { books, position, rotation } = layout;
        const groupMatrix = new THREE.Matrix4().makeRotationY(rotation).setPosition(...position);
        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            const shelfIndex = Math.floor(i / BOOKS_PER_SHELF);
            const indexOnShelf = i % BOOKS_PER_SHELF;
            const y = shelfIndex * SHELF_GAP + SHELF_HEIGHT / 2;
            const x = -BOOKCASE_WIDTH / 2 + 0.2 + indexOnShelf * (SPINE_WIDTH + 0.02);
            const height = getHeightVariation(book.title);
            const localPos = new THREE.Vector3(x, y + height / 2, -0.05);
            localPos.applyMatrix4(groupMatrix);
            const bgColor = getSpineColorHex(book);
            spines.push({
                bookId: book.id!,
                bookTitle: book.title,
                bookAuthor: book.author,
                position: localPos,
                height,
                texture: generateSpineTexture(book.title, book.author, bgColor),
            });
        }
    }
    return spines;
}

// All book spines as a single group of meshes sharing one geometry
const BookSpines = forwardRef<THREE.Group, { spines: SpineData[] }>(
    function BookSpines({ spines }, ref) {
        const groupRef = useRef<THREE.Group>(null!);
        useImperativeHandle(ref, () => groupRef.current);

        const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

        return (
            <group ref={groupRef}>
                {spines.map((spine, i) => (
                    <mesh
                        key={spine.bookId}
                        geometry={geometry}
                        position={spine.position}
                        scale={[SPINE_WIDTH, spine.height, SPINE_DEPTH * 0.9]}
                        userData={{ spineIndex: i }}
                    >
                        <meshBasicMaterial map={spine.texture} />
                    </mesh>
                ))}
            </group>
        );
    }
);

function CrosshairLook({ spines, groupRef, tooltipRef }: {
    spines: SpineData[];
    groupRef: React.RefObject<THREE.Group | null>;
    tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
    const { camera } = useThree();
    const router = useRouter();
    const raycaster = useMemo(() => {
        const rc = new THREE.Raycaster();
        rc.far = 20;
        return rc;
    }, []);
    const prevMesh = useRef<THREE.Mesh | null>(null);
    const prevColor = useRef<THREE.Color | null>(null);
    const currentSpine = useRef<SpineData | null>(null);
    const direction = useMemo(() => new THREE.Vector3(), []);
    const hoverColor = new THREE.Color("#d4a574");

    useEffect(() => {
        const onClick = () => {
            if (currentSpine.current) {
                router.push(`/books/${currentSpine.current.bookId}`);
            }
        };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, [router]);

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;

        camera.getWorldDirection(direction);
        raycaster.set(camera.position, direction);
        const hits = raycaster.intersectObjects(group.children, false);

        let hitMesh: THREE.Mesh | null = null;
        let hitSpine: SpineData | null = null;

        if (hits.length > 0) {
            const obj = hits[0].object as THREE.Mesh;
            const idx = obj.userData.spineIndex;
            if (idx !== undefined && idx < spines.length) {
                hitMesh = obj;
                hitSpine = spines[idx];
            }
        }

        // Unhighlight previous
        if (prevMesh.current && prevMesh.current !== hitMesh) {
            const mat = prevMesh.current.material as THREE.MeshBasicMaterial;
            mat.color.set(0xffffff); // Reset tint (texture provides the color)
            prevMesh.current = null;
        }

        // Highlight new
        if (hitMesh && hitMesh !== prevMesh.current) {
            const mat = hitMesh.material as THREE.MeshBasicMaterial;
            mat.color.copy(hoverColor);
            prevMesh.current = hitMesh;
        }

        currentSpine.current = hitSpine;

        // Update tooltip
        const el = tooltipRef.current;
        if (el) {
            if (hitSpine) {
                el.style.display = "block";
                el.innerHTML = `<p style="color:rgba(255,241,214,0.9);font-size:14px;font-weight:500;margin:0">${hitSpine.bookTitle}</p><p style="color:rgba(168,162,158,1);font-size:12px;margin:2px 0 0">${hitSpine.bookAuthor}</p>`;
            } else {
                el.style.display = "none";
            }
        }
    });

    return null;
}

function Furniture({ layouts }: { layouts: BookcaseLayout[] }) {
    const geometry = useMemo(() => {
        const woodColor = new THREE.Color("#6b4a2e");
        const backColor = new THREE.Color("#4a3018");
        const sideColor = new THREE.Color("#5a3a1e");
        const geos: THREE.BoxGeometry[] = [];
        const mats: THREE.Matrix4[] = [];
        const cols: THREE.Color[] = [];

        for (const layout of layouts) {
            const { books, position, rotation } = layout;
            const shelfCount = Math.ceil(books.length / BOOKS_PER_SHELF);
            const width = BOOKCASE_WIDTH;
            const gm = new THREE.Matrix4().makeRotationY(rotation).setPosition(...position);
            const backH = shelfCount * SHELF_GAP + 0.5;

            geos.push(new THREE.BoxGeometry(width + 0.2, backH, 0.05));
            mats.push(new THREE.Matrix4().setPosition(0, backH / 2 + 0.2, -SHELF_DEPTH / 2 + 0.02).premultiply(gm));
            cols.push(backColor);

            for (const side of [-1, 1]) {
                geos.push(new THREE.BoxGeometry(0.1, backH, SHELF_DEPTH));
                mats.push(new THREE.Matrix4().setPosition(side * (width / 2 + 0.05), backH / 2 + 0.2, -0.05).premultiply(gm));
                cols.push(sideColor);
            }
            for (let s = 0; s <= shelfCount; s++) {
                geos.push(new THREE.BoxGeometry(width + 0.2, SHELF_HEIGHT, SHELF_DEPTH));
                mats.push(new THREE.Matrix4().setPosition(0, s * SHELF_GAP, -0.05).premultiply(gm));
                cols.push(woodColor);
            }
        }

        const allPos: number[] = [];
        const allNorm: number[] = [];
        const allCol: number[] = [];
        for (let i = 0; i < geos.length; i++) {
            const g = geos[i].toNonIndexed();
            g.applyMatrix4(mats[i]);
            const p = g.getAttribute("position");
            const n = g.getAttribute("normal");
            for (let j = 0; j < p.count; j++) {
                allPos.push(p.getX(j), p.getY(j), p.getZ(j));
                allNorm.push(n.getX(j), n.getY(j), n.getZ(j));
                allCol.push(cols[i].r, cols[i].g, cols[i].b);
            }
            g.dispose();
        }
        geos.forEach(g => g.dispose());

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(allPos, 3));
        geo.setAttribute("normal", new THREE.Float32BufferAttribute(allNorm, 3));
        geo.setAttribute("color", new THREE.Float32BufferAttribute(allCol, 3));
        return geo;
    }, [layouts]);

    return (
        <mesh geometry={geometry} frustumCulled={false}>
            <meshStandardMaterial vertexColors />
        </mesh>
    );
}

function GenreLabels({ layouts }: { layouts: BookcaseLayout[] }) {
    return (
        <>
            {layouts.map((layout, i) => {
                const shelfCount = Math.ceil(layout.books.length / BOOKS_PER_SHELF);
                const y = shelfCount * SHELF_GAP + 0.3;
                const pos = new THREE.Vector3(0, y, 0.1);
                pos.applyMatrix4(new THREE.Matrix4().makeRotationY(layout.rotation).setPosition(...layout.position));

                return (
                    <Html
                        key={`${layout.genre}-${i}`}
                        position={[pos.x, pos.y, pos.z]}
                        center
                        distanceFactor={8}
                        style={{ pointerEvents: "none" }}
                    >
                        <div
                            className="text-amber-200/90 whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                            style={{ fontFamily: "var(--font-caveat)", fontSize: "20px" }}
                        >
                            {layout.genre}
                        </div>
                    </Html>
                );
            })}
        </>
    );
}

function Room() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[60, 60]} />
                <meshBasicMaterial color="#4a3828" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7, 0]}>
                <planeGeometry args={[60, 60]} />
                <meshBasicMaterial color="#2a2018" />
            </mesh>
        </group>
    );
}

function Movement() {
    const { camera } = useThree();
    const keys = useRef<Set<string>>(new Set());

    useEffect(() => {
        const down = (e: KeyboardEvent) => keys.current.add(e.code);
        const up = (e: KeyboardEvent) => keys.current.delete(e.code);
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    }, []);

    useFrame((_, delta) => {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        const dir = new THREE.Vector3();
        if (keys.current.has("KeyW") || keys.current.has("ArrowUp")) dir.add(forward);
        if (keys.current.has("KeyS") || keys.current.has("ArrowDown")) dir.sub(forward);
        if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) dir.add(right);
        if (keys.current.has("KeyA") || keys.current.has("ArrowLeft")) dir.sub(right);
        if (dir.length() > 0) camera.position.add(dir.normalize().multiplyScalar(5 * delta));
        camera.position.y = 1.6;
    });

    return null;
}

function Scene({ layouts, spines, tooltipRef }: {
    layouts: BookcaseLayout[];
    spines: SpineData[];
    tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
    const groupRef = useRef<THREE.Group>(null);

    return (
        <>
            <ambientLight intensity={1.0} />
            <hemisphereLight args={["#ffecd2", "#4a3828", 0.8]} />
            <pointLight position={[0, 5.5, 0]} intensity={25} color="#ffd4a0" distance={30} />
            <pointLight position={[-15, 5.5, 0]} intensity={20} color="#ffd4a0" distance={25} />
            <pointLight position={[15, 5.5, 0]} intensity={20} color="#ffd4a0" distance={25} />
            <pointLight position={[0, 5.5, -3]} intensity={15} color="#ffecd2" distance={20} />
            <pointLight position={[0, 5.5, 3]} intensity={15} color="#ffecd2" distance={20} />
            <Room />
            <Movement />
            <PointerLockControls />
            <Furniture layouts={layouts} />
            <BookSpines ref={groupRef} spines={spines} />
            <CrosshairLook spines={spines} groupRef={groupRef} tooltipRef={tooltipRef} />
            <GenreLabels layouts={layouts} />
        </>
    );
}

export default function Library3D({ books }: { books: Book[] }) {
    const [entered, setEntered] = useState(false);
    const [showCanvas, setShowCanvas] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const layouts = useMemo(() => buildLayouts(books), [books]);
    const [spines, setSpines] = useState<SpineData[] | null>(null);

    // Generate textures after entering (needs DOM/canvas)
    useEffect(() => {
        if (!entered) return;
        setSpines(buildSpineData(layouts));
    }, [entered, layouts]);

    useEffect(() => {
        if (!spines) return;
        const id = requestAnimationFrame(() => setShowCanvas(true));
        return () => { cancelAnimationFrame(id); setShowCanvas(false); };
    }, [spines]);

    return (
        <div className="relative w-full" style={{ height: "calc(100vh - 80px)" }}>
            {!showCanvas && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                    <h2
                        className="text-amber-200/90 text-3xl mb-2"
                        style={{ fontFamily: "var(--font-caveat)" }}
                    >
                        The Library
                    </h2>
                    <p className="text-stone-400 text-sm mb-6 text-center px-4">
                        {entered ? "Preparing the shelves..." : (
                            <>
                                Click to enter. WASD to move, mouse to look around.
                                <br />Look at a book to see its title. Click to open it.
                            </>
                        )}
                    </p>
                    {!entered && (
                        <button
                            onClick={() => setEntered(true)}
                            className="text-amber-200/90 border border-amber-200/30 px-6 py-2 rounded-sm hover:bg-amber-200/10 transition-colors"
                            style={{ fontFamily: "var(--font-caveat)", fontSize: "20px" }}
                        >
                            Enter
                        </button>
                    )}
                </div>
            )}
            {showCanvas && spines && (
                <Canvas
                    camera={{ position: [0, 1.6, 0], near: 0.05, far: 100, fov: 75 }}
                    gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
                    onCreated={({ gl }) => { gl.setPixelRatio(1); }}
                >
                    <Scene layouts={layouts} spines={spines} tooltipRef={tooltipRef} />
                </Canvas>
            )}

            {showCanvas && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div
                        ref={tooltipRef}
                        className="bg-black/80 px-3 py-1.5 rounded-sm text-center whitespace-nowrap mb-3"
                        style={{ display: "none" }}
                    />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-200/60" />
                </div>
            )}
        </div>
    );
}
