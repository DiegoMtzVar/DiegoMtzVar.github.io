import React, { Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, Text3D, useMatcapTexture, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';
import { useControls } from 'leva';

import './styles.css';

const originalAssetList = ['tile', 'tile-dirt', 'tile-tree', 'tile-corner-round', 'tile-spawn-end', 'tile-split', 'tile-hill', 'tile-river-waterfall', 'tile-crystal', 'tile-tree-quad', 'spawn-round', 'tile-straight-slope-large', 'tile-river-corner', 'detail-tree', 'tile-river-bridge', 'tile-river-slope','tile-crossing', 'tile-end-round', 'tile-tree-double', 'tile-corner-large', 'tile-rock', 'tile-river-slope-large', 'tile-straight', 'tile-wide-corner', 'tile-spawn', 'tile-corner-inner', 'tile-bump', 'tile-transition', 'tile-end', 'tile-river-transition', 'tile-wide-straight', 'tile-corner-square', 'tile-slope', 'tile-corner-outer', 'tile-river-straight', 'tile-wide-transition', 'tile-spawn-end-round', 'tile-wide-split', 'tile-spawn-round', 'tile-straight-slope', 'snow-tile-river-bridge', 'snow-tile-straight', 'snow-detail-crystal-large', 'wood-structure', 'snow-tile-spawn-round', 'tower-square-build-f', 'weapon-ammo-arrow', 'enemy-ufo-b-weapon', 'snow-tile-dirt', 'snow-tile-wide-corner', 'detail-rocks', 'snow-tile-straight-slope', 'selection-a', 'snow-tile-river-waterfall', 'snow-tile-tree', 'snow-tile-straight-slope-large', 'snow-tile-split', 'snow-detail-dirt-large', 'snow-detail-crystal', 'snow-tile-spawn-end-round', 'snow-detail-rocks', 'snow-tile-corner-round', 'snow-wood-structure-part', 'detail-tree-large', 'snow-tile-tree-quad', 'detail-crystal', 'detail-dirt-large', 'snow-tile-corner-large', 'snow-tile-rock', 'detail-rocks-large', 'snow-tile-crystal', 'snow-wood-structure', 'detail-dirt', 'wood-structure-high', 'snow-tile-spawn-end', 'enemy-ufo-d', 'snow-tile-river-slope', 'snow-tile-end-round', 'detail-crystal-large', 'snow-detail-tree', 'snow-tile-wide-straight', 'snow-tile-river-transition', 'snow-detail-dirt', 'snow-tile-corner-square', 'snow-tile-end', 'snow-tile-tree-double', 'snow-tile-slope', 'snow-tile-transition', 'weapon-turret', 'tower-round-build-a','tower-square-roof-c', 'enemy-ufo-a', 'selection-b', 'enemy-ufo-b', 'snow-tile-spawn', 'snow-tile-corner-outer', 'snow-tile-river-corner', 'snow-tile-river-straight',  'snow-tile-wide-transition', 'wood-structure-part', 'tower-square-build-c', 'snow-tile-hill', 'weapon-ammo-bullet', 'spawn-square', 'wood-structure-high-part', 'weapon-ammo-cannonball', 'snow-tile-river-slope-large', 'snow-detail-rocks-large', 'tower-round-build-b', 'snow-tile-corner-inner', 'tower-round-roof-c', 'enemy-ufo-c-weapon', 'tower-square-middle-c', 'tower-square-top-a', 'weapon-catapult', 'snow-tile', 'enemy-ufo-beam', 'snow-tile-wide-split', 'snow-tile-bump', 'tower-square-bottom-b', 'tower-round-build-f', 'snow-detail-tree-large', 'snow-tile-crossing', 'weapon-ballista', 'tower-square-top-b', 'snow-wood-structure-high-part', 'tower-round-build-c', 'tower-square-build-d', 'tower-round-top-c', 'tower-square-build-e', 'tower-round-bottom-b', 'tower-round-middle-c', 'tower-round-bottom-c', 'enemy-ufo-beam-burst', 'tower-square-bottom-a', 'tower-square-build-b', 'tower-round-roof-b', 'tower-square-roof-b', 'enemy-ufo-c', 'tower-square-build-a', 'tower-square-top-c', 'weapon-cannon', 'enemy-ufo-d-weapon', 'enemy-ufo-a-weapon', 'tower-round-bottom-a', 'tower-round-top-a', 'tower-round-base', 'tower-square-roof-a', 'tower-round-roof-a', 'tower-square-middle-a', 'snow-wood-structure-high', 'weapon-ammo-boulder', 'tower-round-middle-a', 'tower-round-build-d', 'tower-round-build-e', 'tower-square-bottom-c', 'tower-round-middle-b', 'tower-round-top-b', 'tower-round-crystals', 'tower-square-middle-b', 'Pickaxe'];

const assetList = ['Pickaxe'];

const tiles = [
    'tile', 'tile-dirt', 
    'tile-spawn', 'tile-spawn-end', 'tile-spawn-round', 'tile-spawn-end-round', 
    'tile-slope', 'tile-corner-inner', 'tile-corner-outer',
    'tile-tree', 'tile-tree-double', 'tile-tree-quad',
    'tile-hill', 'tile-rock', 'tile-crystal', 
    'tile-end', 'tile-end-round', 'tile-straight', 'tile-corner-round', 'tile-corner-square', 'tile-split', 'tile-crossing', 'tile-bump', 'tile-transition', 'tile-straight-slope', 
    'tile-river-straight', 'tile-river-transition', 'tile-river-corner', 'tile-river-bridge', 'tile-river-slope', 'tile-river-waterfall', 'tile-river-slope-large', 
    'tile-wide-straight', 'tile-straight-slope-large', 'tile-wide-corner', 'tile-corner-large', 'tile-wide-transition', 'tile-wide-split']


const snowTiles = [
    'snow-tile', 'snow-tile-dirt', 
    'snow-tile-spawn', 'snow-tile-spawn-end', 'snow-tile-spawn-round', 'snow-tile-spawn-end-round', 
    'snow-tile-slope', 'snow-tile-corner-inner', 'snow-tile-corner-outer',
    'snow-tile-tree', 'snow-tile-tree-double', 'snow-tile-tree-quad',
    'snow-tile-hill', 'snow-tile-rock', 'snow-tile-crystal',
    'snow-tile-end', 'snow-tile-end-round', 'snow-tile-straight', 'snow-tile-corner-round', 'snow-tile-corner-square', 'snow-tile-split', 'snow-tile-crossing', 'snow-tile-bump', 'snow-tile-transition', 'snow-tile-straight-slope',
    'snow-tile-river-straight','snow-tile-river-transition', 'snow-tile-river-corner', 'snow-tile-river-bridge', 'snow-tile-river-slope', 'snow-tile-river-waterfall', 'snow-tile-river-slope-large', 
    'snow-tile-wide-straight', 'snow-tile-straight-slope-large', 'snow-tile-wide-corner', 'snow-tile-corner-large', 'snow-tile-wide-transition', 'snow-tile-wide-split']

const details = ['detail-crystal-large', 'detail-rocks-large', 'detail-dirt', 'detail-crystal', 'detail-dirt-large', 'detail-tree-large','detail-rocks', 'detail-tree', 'wood-structure', 'wood-structure-part', 'wood-structure-high', 'wood-structure-high-part', ]
const snowDetails = ['snow-detail-tree-large', 'snow-detail-rocks-large', 'snow-detail-dirt', 'snow-detail-tree', 'snow-detail-dirt-large', 'snow-detail-crystal', 'snow-detail-rocks', 'snow-detail-crystal-large', 'snow-wood-structure', 'snow-wood-structure-part', 'snow-wood-structure-high', 'snow-wood-structure-high-part', ]


const towers = ['tower-round-bottom-a', 'tower-square-bottom-a', 'tower-round-bottom-b', 'tower-square-bottom-b', 'tower-round-bottom-c', 'tower-square-bottom-c', 'tower-round-middle-c', 'tower-square-middle-a', 'tower-round-middle-a', 'tower-round-middle-b', 'tower-square-middle-b', 'tower-square-middle-c', 'tower-round-top-a', 'tower-square-top-a', 'tower-round-top-b', 'tower-square-top-b', 'tower-round-top-c', 'tower-square-top-c', 'tower-round-build-a', 'tower-square-build-a', 'tower-round-build-b', 'tower-square-build-b', 'tower-round-build-c', 'tower-square-build-c', 'tower-round-build-d', 'tower-square-build-d', 'tower-round-build-e', 'tower-square-build-e', 'tower-round-build-f', 'tower-square-build-f', 'tower-round-roof-b', 'tower-square-roof-b', 'tower-square-roof-a', 'tower-round-roof-a', 'tower-round-roof-c', 'tower-square-roof-c', 'tower-round-crystals', 'tower-round-base']

const enemies = ['enemy-ufo-a', 'enemy-ufo-a-weapon', 'enemy-ufo-b',  'enemy-ufo-b-weapon', 'enemy-ufo-c', 'enemy-ufo-c-weapon', 'enemy-ufo-d', 'enemy-ufo-d-weapon', ]

const weapons = ['weapon-ballista', 'weapon-catapult', 'weapon-cannon', 'weapon-turret',]
const ammo =['weapon-ammo-arrow', 'weapon-ammo-boulder', 'weapon-ammo-cannonball', 'weapon-ammo-bullet', 'enemy-ufo-beam', 'enemy-ufo-beam-burst', ]

const extra = ['selection-a', 'selection-b', 'spawn-square', 'spawn-round']

const assetGroups = [tiles, snowTiles, towers, details, snowDetails, enemies, weapons, ammo, extra];

export default function TowerDefense() {
    return (
        <div className='nightScene'>
        <Canvas>
        <Suspense fallback={"Loading"}>
          <Stars
            radius={100}
            depth={100}
            count={4000}
            factor={4}
            saturation={0}
            fade
            speed={0.2}
          />
            <Experience />
        </Suspense>
        </Canvas>
        </div>
    );
}

const Asset = (props) => {
  const { nodes, materials, scene } = useGLTF(`/assets/${props.assetName}.glb`)
  const altImage = useLoader(THREE.ImageBitmapLoader, '/assets/Textures/variation-a.png');
  const altTexture = Object.assign(new THREE.CanvasTexture(altImage), { colorSpace: THREE.SRGBColorSpace });
  const nodesArray = Object.values(nodes);
  useEffect(() => {
    scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
  }, [scene]);

  return (
    <group {...props} dispose={null}>
        {nodesArray.map((node, index) => {
            return <mesh key={index} castShadow receiveShadow geometry={node.geometry} position={node.position}
            material={
            props.altTexture ?
            new THREE.MeshStandardMaterial({map: altTexture}) : node.material} />
        })}
    </group>
    )
}

const Test = ({ assetName, ...props }) => {
    const { nodes, scene } = useGLTF(`/assets/${assetName}.glb`)
    const altImage = useLoader(THREE.ImageBitmapLoader, '/assets/Textures/variation-a.png');
    const altTexture = Object.assign(new THREE.CanvasTexture(altImage), { colorSpace: THREE.SRGBColorSpace });
    const nodesArray = Object.values(nodes);
    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    return (
    <group {...props} dispose={null}>
        {nodesArray.map((node, index) => {
            return <mesh key={index} castShadow receiveShadow geometry={node.geometry} position={node.position}
            material={
            props.altTexture ?
            new THREE.MeshStandardMaterial({map: altTexture}) : node.material} />
        })}
    </group>
    )
}

const AssetGrid = () => {
    let {assetGroupID, altTexture} = useControls({
        assetGroupID: {value: 0, options: {tiles: 0, snowTiles: 1, towers: 2, details: 3, snowDetails: 4, enemies: 5, weapons: 6, ammo: 7, extra: 8}},
        altTexture: false,
    });
    let rows = 10;
    const [matcapTexture] = useMatcapTexture("CB4E88_F99AD6_F384C3_ED75B9");
    return (
        <group>
            {assetGroups[assetGroupID].map((asset, index) => {
                return (<group position={[(index % rows) *2, 3, Math.floor(index / rows)*2]}>
                    <Text3D
                    position={[0, 1, 0]}
                    scale={[0.05, 0.05, 0.05]}
                    font={"/gt.json"}>
                    
                    {asset}
                <meshMatcapMaterial color="white" matcap={matcapTexture} />
                </Text3D>

                <Asset altTexture={altTexture} key={index} assetName={asset}  />
                </group>)
            })}
        </group>
    );
}

const TestBoard = (props) => {
    const board = [[3, 2, 1], [0, 1, 1], [0, 0, 0]]
    return (
        <group position={props.position}>
            <AssetGrid />
            <Test assetName={"enemy-ufo-a"} position={[2, 1, 1]}  />
            <Test assetName={"weapon-turret"} position={[2, 1, 3]}  />


            {board.map((row, i) => row.map((tile, j) =>  
                tile === 0 ? <Asset assetName={"tile"} altTexture position={[i, 0, j]} /> : 
                tile === 1 ?<Asset assetName={"tile-dirt"} altTexture position={[i, 0, j]} /> :
                tile === 2 ? <Asset assetName={"tile-straight"} altTexture position={[i, 0, j]} /> :
                tile === 3 ? <Asset assetName={"tile-tree"} altTexture  position={[i, 0, j]} /> :
                null))}
        </group>
    );
}

const Camera = ( props ) => {
    // TODO: Clamp camera pan position

    return (
        <OrbitControls 
            {...props}
            maxDistance={5} 
            minDistance={1} 
            minPolarAngle={0.5} 
            maxPolarAngle={1.5}
            enableKeys={true}
            enableRotate={true}
                />
    );
}

const TileGroup = ({tileGroup, position, ...props}) => {
    return (
        <group position={position}>
            {tileGroup.map((row, i) => row.map((tile, j) => <Asset {...props} assetName={tile} position={[i, 0, j]} />))}
        </group>
    );
}

const Spawn = ({position}) => {
    const spawnTileGroup = [
        ['tile', 'tile-tree', 'tile'], 
        ['tile-crystal', 'tile-end-round', 'tile-straight'], 
        ['tile-tree-double', 'tile', 'tile-tree-quad']];
    return (
        <group>
            <TileGroup tileGroup={spawnTileGroup} position={position} />
        </group>
    );
}

const Experience = () => {
    return (
        <>
        <ambientLight intensity={1} />
        <directionalLight castShadow position={[0, 5, 0]} intensity={1} />
        <TestBoard position={[0, -5, 0]} />

        <Spawn position={[0,0,0]}/>
        <Camera />
        </>
    );
}