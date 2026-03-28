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
const ROW_SPACING = 3.5; // distance between rows (aisle width)
const CASES_PER_ROW = 4; // bookcases per side of a row

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

function generateCoverTexture(title: string, author: string, genre: string, bgColor: string): THREE.CanvasTexture {
    const w = 512;
    const h = 768;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Spine edge
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, 8, h);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(w - 2, 0, 2, h);

    const light = isLightColor(bgColor);
    const textColor = light ? "rgba(40,30,20,0.9)" : "rgba(255,241,214,0.9)";
    const subColor = light ? "rgba(40,30,20,0.5)" : "rgba(255,241,214,0.5)";
    const mutedColor = light ? "rgba(40,30,20,0.3)" : "rgba(255,241,214,0.25)";

    // Title
    ctx.fillStyle = textColor;
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = title.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 80) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);

    const titleY = h * 0.38;
    const lineH = 44;
    const startY = titleY - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, startY + i * lineH));

    // Divider
    ctx.fillStyle = mutedColor;
    ctx.fillRect(w / 2 - 60, titleY + lines.length * lineH / 2 + 20, 120, 2);

    // Author
    ctx.fillStyle = subColor;
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText(author, w / 2, titleY + lines.length * lineH / 2 + 55);

    // Genre at bottom
    ctx.fillStyle = mutedColor;
    ctx.font = "14px Georgia, serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(genre.toUpperCase(), w / 2, h - 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

interface ViewingState {
    spine: SpineData;
    coverTexture: THREE.CanvasTexture;
    coverImageTexture: THREE.Texture | null;
    progress: number; // 0 = on shelf, 1 = in front of camera
}

function ViewingBook({ viewing, onClose, onNavigate }: {
    viewing: ViewingState;
    onClose: () => void;
    onNavigate: () => void;
}) {
    const { camera } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const progressRef = useRef(viewing.progress);
    const startPos = useRef(viewing.spine.position.clone());

    // Animate progress 0 -> 1
    useFrame((_, delta) => {
        if (!meshRef.current) return;
        progressRef.current = Math.min(1, progressRef.current + delta * 2.5);
        const t = progressRef.current;
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);

        // Target: 1.5 units in front of camera
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const targetPos = camera.position.clone().add(forward.multiplyScalar(1.5));
        targetPos.y = 1.5;

        // Lerp position
        meshRef.current.position.lerpVectors(startPos.current, targetPos, ease);

        // Face camera
        const lookTarget = camera.position.clone();
        lookTarget.y = meshRef.current.position.y;
        meshRef.current.lookAt(lookTarget);

        // Scale up
        const startScale = new THREE.Vector3(SPINE_WIDTH, viewing.spine.height, SPINE_DEPTH * 0.9);
        const endScale = new THREE.Vector3(0.8, 1.1, 0.05);
        meshRef.current.scale.lerpVectors(startScale, endScale, ease);
    });

    const texture = viewing.coverImageTexture || viewing.coverTexture;

    return (
        <mesh ref={meshRef} position={viewing.spine.position.clone()}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
}

interface BookcaseLayout {    genre: string;
    books: Book[];
    position: [number, number, number];
    rotation: number;
}

interface SpineData {
    bookId: number;
    bookTitle: string;
    bookAuthor: string;
    bookGenre: string;
    coverImageUrl: string | null;
    bgColor: string;
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

    // Split large genres into bookcase-sized chunks
    const cases: { genre: string; books: Book[] }[] = [];
    for (const [genre, genreBooks] of genres) {
        for (let i = 0; i < genreBooks.length; i += MAX_BOOKS_PER_CASE) {
            const chunk = genreBooks.slice(i, i + MAX_BOOKS_PER_CASE);
            const label = i === 0 ? genre : `${genre} (cont.)`;
            cases.push({ genre: label, books: chunk });
        }
    }

    // Arrange into double-sided rows
    // Each row has CASES_PER_ROW bookcases on the front and CASES_PER_ROW on the back
    const casesPerRow = CASES_PER_ROW * 2;
    const layouts: BookcaseLayout[] = [];
    const rowWidth = (CASES_PER_ROW - 1) * CASE_SPACING;

    for (let i = 0; i < cases.length; i++) {
        const rowIndex = Math.floor(i / casesPerRow);
        const posInRow = i % casesPerRow;
        const side = posInRow < CASES_PER_ROW ? 0 : 1; // 0 = front, 1 = back
        const col = posInRow < CASES_PER_ROW ? posInRow : posInRow - CASES_PER_ROW;

        const x = col * CASE_SPACING - rowWidth / 2;
        const z = rowIndex * (ROW_SPACING + SHELF_DEPTH * 2) + (side === 0 ? -0.5 : 0.5);
        const rotation = side === 0 ? Math.PI : 0;

        layouts.push({
            ...cases[i],
            position: [x, 0, z],
            rotation,
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
                bookGenre: book.genre,
                coverImageUrl: book.coverImageUrl || null,
                bgColor,
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

function CrosshairLook({ spines, groupRef, tooltipRef, onSelect, disabled }: {
    spines: SpineData[];
    groupRef: React.RefObject<THREE.Group | null>;
    tooltipRef: React.RefObject<HTMLDivElement | null>;
    onSelect: (spine: SpineData) => void;
    disabled: boolean;
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
            if (!disabled && currentSpine.current) {
                onSelect(currentSpine.current);
            }
        };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, [router, onSelect, disabled]);

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

            // Back panel — full height from floor
            geos.push(new THREE.BoxGeometry(width + 0.2, backH, 0.05));
            mats.push(new THREE.Matrix4().setPosition(0, backH / 2, -SHELF_DEPTH / 2 + 0.02).premultiply(gm));
            cols.push(backColor);

            // Side panels — full height from floor
            for (const side of [-1, 1]) {
                geos.push(new THREE.BoxGeometry(0.1, backH, SHELF_DEPTH));
                mats.push(new THREE.Matrix4().setPosition(side * (width / 2 + 0.05), backH / 2, -0.05).premultiply(gm));
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

function Room({ layouts }: { layouts: BookcaseLayout[] }) {
    // Calculate room size from layout bounds
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const l of layouts) {
            minX = Math.min(minX, l.position[0] - BOOKCASE_WIDTH);
            maxX = Math.max(maxX, l.position[0] + BOOKCASE_WIDTH);
            minZ = Math.min(minZ, l.position[2] - 2);
            maxZ = Math.max(maxZ, l.position[2] + 2);
        }
        const pad = 4;
        return {
            w: (maxX - minX) + pad * 2,
            d: (maxZ - minZ) + pad * 2,
            cx: (minX + maxX) / 2,
            cz: (minZ + maxZ) / 2,
        };
    }, [layouts]);

    const wallH = 4.5;
    const wallColor = "#3a2a1a";
    const wallColorLight = "#4a3828";

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.cx, 0, bounds.cz]}>
                <planeGeometry args={[bounds.w, bounds.d]} />
                <meshStandardMaterial color="#5a4430" />
            </mesh>
            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[bounds.cx, wallH, bounds.cz]}>
                <planeGeometry args={[bounds.w, bounds.d]} />
                <meshStandardMaterial color="#4a3828" />
            </mesh>
            {/* Back wall (-Z) */}
            <mesh position={[bounds.cx, wallH / 2, bounds.cz - bounds.d / 2]}>
                <planeGeometry args={[bounds.w, wallH]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>
            {/* Front wall (+Z) */}
            <mesh position={[bounds.cx, wallH / 2, bounds.cz + bounds.d / 2]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[bounds.w, wallH]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>
            {/* Left wall (-X) */}
            <mesh position={[bounds.cx - bounds.w / 2, wallH / 2, bounds.cz]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[bounds.d, wallH]} />
                <meshStandardMaterial color={wallColorLight} />
            </mesh>
            {/* Right wall (+X) */}
            <mesh position={[bounds.cx + bounds.w / 2, wallH / 2, bounds.cz]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[bounds.d, wallH]} />
                <meshStandardMaterial color={wallColorLight} />
            </mesh>

            {/* Windows on both side walls */}
            {[-1, 1].map((wallSide) => {
                const wx = bounds.cx + wallSide * (bounds.w / 2 - 0.01);
                const faceRot = wallSide === -1 ? Math.PI / 2 : -Math.PI / 2;
                return [-0.25, 0.25].map((frac, i) => {
                    const wz = bounds.cz + bounds.d * frac;
                    return (
                        <group key={`win-${wallSide}-${i}`}>
                            <mesh position={[wx, 2.8, wz]} rotation={[0, faceRot, 0]}>
                                <planeGeometry args={[2.5, 1.8]} />
                                <meshBasicMaterial color="#b8cce0" />
                            </mesh>
                            <mesh position={[wx, 2.8, wz]} rotation={[0, faceRot, 0]}>
                                <boxGeometry args={[2.5, 0.06, 0.04]} />
                                <meshStandardMaterial color="#2a1f14" />
                            </mesh>
                            <mesh position={[wx, 2.8, wz]} rotation={[0, faceRot, 0]}>
                                <boxGeometry args={[0.06, 1.8, 0.04]} />
                                <meshStandardMaterial color="#2a1f14" />
                            </mesh>
                            <mesh position={[wx + wallSide * 0.04, 1.9, wz]} rotation={[0, faceRot, 0]}>
                                <boxGeometry args={[2.7, 0.06, 0.15]} />
                                <meshStandardMaterial color="#5a4430" />
                            </mesh>
                        </group>
                    );
                });
            })}

            {/* Skirting boards */}
            {/* Back */}
            <mesh position={[bounds.cx, 0.06, bounds.cz - bounds.d / 2 + 0.03]}>
                <boxGeometry args={[bounds.w, 0.12, 0.06]} />
                <meshStandardMaterial color="#3a2510" />
            </mesh>
            {/* Front */}
            <mesh position={[bounds.cx, 0.06, bounds.cz + bounds.d / 2 - 0.03]}>
                <boxGeometry args={[bounds.w, 0.12, 0.06]} />
                <meshStandardMaterial color="#3a2510" />
            </mesh>
            {/* Left */}
            <mesh position={[bounds.cx - bounds.w / 2 + 0.03, 0.06, bounds.cz]}>
                <boxGeometry args={[0.06, 0.12, bounds.d]} />
                <meshStandardMaterial color="#3a2510" />
            </mesh>
            {/* Right */}
            <mesh position={[bounds.cx + bounds.w / 2 - 0.03, 0.06, bounds.cz]}>
                <boxGeometry args={[0.06, 0.12, bounds.d]} />
                <meshStandardMaterial color="#3a2510" />
            </mesh>
        </group>
    );
}

function CeilingLights({ layouts }: { layouts: BookcaseLayout[] }) {
    // Find unique row Z positions and the X range
    const lights = useMemo(() => {
        const rowZs = new Set<number>();
        let minX = Infinity, maxX = -Infinity;
        for (const l of layouts) {
            // Round to group front/back of same row
            const rowZ = Math.round(l.position[2] / (ROW_SPACING + SHELF_DEPTH * 2)) * (ROW_SPACING + SHELF_DEPTH * 2);
            rowZs.add(rowZ);
            minX = Math.min(minX, l.position[0]);
            maxX = Math.max(maxX, l.position[0]);
        }
        const cx = (minX + maxX) / 2;
        const result: [number, number][] = [];
        // Lights in the aisles between rows and at the edges
        const sortedZ = Array.from(rowZs).sort((a, b) => a - b);
        // Before first row
        if (sortedZ.length > 0) result.push([cx, sortedZ[0] - ROW_SPACING / 2 - 0.5]);
        // Between rows
        for (let i = 0; i < sortedZ.length - 1; i++) {
            result.push([cx, (sortedZ[i] + sortedZ[i + 1]) / 2]);
        }
        // After last row
        if (sortedZ.length > 0) result.push([cx, sortedZ[sortedZ.length - 1] + ROW_SPACING / 2 + 0.5]);
        return result;
    }, [layouts]);

    return (
        <>
            {lights.map(([x, z], i) => (
                <group key={i}>
                    {/* Light fixture bar */}
                    <mesh position={[x, 4.35, z]}>
                        <boxGeometry args={[BOOKCASE_WIDTH * 2, 0.04, 0.15]} />
                        <meshStandardMaterial color="#2a1f14" />
                    </mesh>
                    {/* Glowing panel */}
                    <mesh position={[x, 4.32, z]}>
                        <boxGeometry args={[BOOKCASE_WIDTH * 1.8, 0.02, 0.1]} />
                        <meshBasicMaterial color="#ffecd2" />
                    </mesh>
                    {/* Actual light */}
                    <pointLight position={[x, 4.2, z]} intensity={12} color="#ffd4a0" distance={12} />
                </group>
            ))}
        </>
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

function Scene({ layouts, spines, tooltipRef, onViewingChange }: {
    layouts: BookcaseLayout[];
    spines: SpineData[];
    tooltipRef: React.RefObject<HTMLDivElement | null>;
    onViewingChange: (viewing: boolean, bookId?: number) => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const router = useRouter();
    const [viewing, setViewing] = useState<ViewingState | null>(null);

    const handleSelect = (spine: SpineData) => {
        const coverTexture = generateCoverTexture(spine.bookTitle, spine.bookAuthor, spine.bookGenre, spine.bgColor);
        const state: ViewingState = { spine, coverTexture, coverImageTexture: null, progress: 0 };
        setViewing(state);
        onViewingChange(true, spine.bookId);

        // Load cover image async if available
        if (spine.coverImageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                // Draw the image onto the cover texture canvas
                const w = 512;
                const h = 768;
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d")!;

                // Background
                ctx.fillStyle = spine.bgColor;
                ctx.fillRect(0, 0, w, h);

                // Spine edge
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.fillRect(0, 0, 8, h);

                // Draw cover image centred in upper portion
                const imgAspect = img.width / img.height;
                const maxW = w - 60;
                const maxH = h * 0.55;
                let drawW = maxW;
                let drawH = drawW / imgAspect;
                if (drawH > maxH) { drawH = maxH; drawW = drawH * imgAspect; }
                const imgX = (w - drawW) / 2;
                const imgY = 30;
                ctx.drawImage(img, imgX, imgY, drawW, drawH);

                // Title below image
                const light = isLightColor(spine.bgColor);
                const textColor = light ? "rgba(40,30,20,0.9)" : "rgba(255,241,214,0.9)";
                const subColor = light ? "rgba(40,30,20,0.5)" : "rgba(255,241,214,0.5)";

                ctx.fillStyle = textColor;
                ctx.font = "bold 28px Georgia, serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";

                const titleY = imgY + drawH + 20;
                const words = spine.bookTitle.split(" ");
                const lines: string[] = [];
                let line = "";
                for (const word of words) {
                    const test = line ? `${line} ${word}` : word;
                    if (ctx.measureText(test).width > w - 60) {
                        if (line) lines.push(line);
                        line = word;
                    } else {
                        line = test;
                    }
                }
                if (line) lines.push(line);
                lines.forEach((l, i) => ctx.fillText(l, w / 2, titleY + i * 34));

                // Author
                ctx.fillStyle = subColor;
                ctx.font = "italic 20px Georgia, serif";
                ctx.fillText(spine.bookAuthor, w / 2, titleY + lines.length * 34 + 10);

                const tex = new THREE.CanvasTexture(canvas);
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                setViewing((prev) => prev ? { ...prev, coverImageTexture: tex } : null);
            };
            img.src = `/api/image-proxy?url=${encodeURIComponent(spine.coverImageUrl)}`;
        }
    };

    const handleClose = () => {
        if (viewing) {
            viewing.coverTexture.dispose();
            viewing.coverImageTexture?.dispose();
        }
        setViewing(null);
        onViewingChange(false);
    };

    const handleNavigate = () => {
        if (viewing) router.push(`/books/${viewing.spine.bookId}`);
    };

    // Q key puts the book back
    useEffect(() => {
        if (!viewing) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "KeyQ" || e.code === "Backspace") {
                e.preventDefault();
                handleClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [viewing]);

    return (
        <>
            <ambientLight intensity={0.6} />
            <hemisphereLight args={["#ffecd2", "#4a3828", 0.5]} />
            <directionalLight position={[-10, 6, 0]} intensity={1.2} color="#ffecd2" />
            <directionalLight position={[10, 6, 0]} intensity={1.2} color="#ffecd2" />
            <pointLight position={[0, 4.2, -1]} intensity={15} color="#ffd4a0" distance={15} />
            <pointLight position={[0, 4.2, 3]} intensity={15} color="#ffd4a0" distance={15} />
            <pointLight position={[-6, 4.2, 1]} intensity={12} color="#ffd4a0" distance={15} />
            <pointLight position={[6, 4.2, 1]} intensity={12} color="#ffd4a0" distance={15} />
            <Room layouts={layouts} />
            <CeilingLights layouts={layouts} />
            <Movement />
            <PointerLockControls />
            <Furniture layouts={layouts} />
            <BookSpines ref={groupRef} spines={spines} />
            <CrosshairLook
                spines={spines}
                groupRef={groupRef}
                tooltipRef={tooltipRef}
                onSelect={handleSelect}
                disabled={!!viewing}
            />
            <GenreLabels layouts={layouts} />
            {viewing && (
                <ViewingBook
                    viewing={viewing}
                    onClose={handleClose}
                    onNavigate={handleNavigate}
                />
            )}
        </>
    );
}

export default function Library3D({ books }: { books: Book[] }) {
    const [entered, setEntered] = useState(false);
    const [showCanvas, setShowCanvas] = useState(false);
    const [viewing, setViewing] = useState(false);
    const viewingIdRef = useRef<number | null>(null);
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
                    camera={{ position: [0, 1.6, -3], near: 0.05, far: 100, fov: 75 }}
                    gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
                    onCreated={({ gl }) => { gl.setPixelRatio(1); }}
                >
                    <Scene
                        layouts={layouts}
                        spines={spines}
                        tooltipRef={tooltipRef}
                        onViewingChange={(v, id) => { setViewing(v); viewingIdRef.current = id ?? null; }}
                    />
                </Canvas>
            )}

            {showCanvas && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    {!viewing && (
                        <>
                            <div
                                ref={tooltipRef}
                                className="bg-black/80 px-3 py-1.5 rounded-sm text-center whitespace-nowrap mb-3"
                                style={{ display: "none" }}
                            />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-200/60" />
                        </>
                    )}
                    {viewing && (
                        <div className="absolute bottom-8 flex gap-6 pointer-events-auto">
                            <button
                                onClick={() => {
                                    if (viewingIdRef.current) window.location.href = `/books/${viewingIdRef.current}`;
                                }}
                                className="text-amber-200/90 border border-amber-200/30 px-4 py-1.5 rounded-sm hover:bg-amber-200/10 transition-colors text-sm"
                                style={{ fontFamily: "var(--font-caveat)" }}
                            >
                                Open
                            </button>
                            <button
                                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }))}
                                className="text-stone-400 hover:text-stone-300 transition-colors text-sm"
                                style={{ fontFamily: "var(--font-caveat)" }}
                            >
                                Put back (Q)
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
