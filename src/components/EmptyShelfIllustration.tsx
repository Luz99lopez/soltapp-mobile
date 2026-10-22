import React from 'react';
import Svg, { Rect, Path, Circle, G, Ellipse } from 'react-native-svg';

interface EmptyShelfIllustrationProps {
  width?: number;
  height?: number;
}

export default function EmptyShelfIllustration({
  width = 240,
  height = 160,
}: EmptyShelfIllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 240 160" fill="none">
      {/* 1. Estantería de fondo (Estructura en gris claro) */}
      <G opacity={0.75}>
        {/* Postes verticales */}
        <Rect x="46" y="16" width="4" height="120" rx="2" fill="#CBD5E1" />
        <Rect x="186" y="16" width="4" height="120" rx="2" fill="#CBD5E1" />

        {/* Baldas horizontales */}
        <Rect x="36" y="24" width="168" height="4" rx="2" fill="#CBD5E1" />
        <Rect x="36" y="64" width="168" height="4" rx="2" fill="#CBD5E1" />
        <Rect x="36" y="104" width="168" height="4" rx="2" fill="#CBD5E1" />

        {/* Separador vertical central */}
        <Rect x="120" y="24" width="2" height="84" fill="#E2E8F0" />
      </G>

      {/* 2. Cesta de compras violeta (lado izquierdo) */}
      <G>
        {/* Asa de la cesta */}
        <Path
          d="M84 104 C84 84, 106 84, 106 104"
          stroke="#581C87"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cuerpo de la cesta */}
        <Path
          d="M74 104 L78 126 L112 126 L116 104 Z"
          fill="#FFFFFF"
          stroke="#581C87"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Rejilla interior de la cesta */}
        <Path
          d="M82 105 L85 125 M95 105 L95 125 M108 105 L105 125"
          stroke="#581C87"
          strokeWidth="2"
        />
        <Path
          d="M76 114 L114 114 M77 120 L113 120"
          stroke="#581C87"
          strokeWidth="2"
        />
      </G>

      {/* 3. Mascota rosa amigable Soltapp (lado derecho) */}
      <G>
        {/* Cuerpo esponjoso */}
        <Path
          d="M125 124 
             C120 100, 132 80, 150 78 
             C168 76, 185 86, 188 108 
             C190 120, 178 128, 155 128 
             C136 128, 128 126, 125 124 Z"
          fill="#F472B6"
        />

        {/* Pancita inferior más oscura */}
        <Path
          d="M130 114 C138 128, 172 128, 184 114 C180 126, 168 128, 155 128 C142 128, 134 124, 130 114 Z"
          fill="#DB2777"
          opacity={0.4}
        />

        {/* Brazo izquierdo abierto */}
        <Path
          d="M132 94 C122 92, 116 97, 120 100 C125 102, 132 99, 134 97 Z"
          fill="#F472B6"
        />
        <Circle cx="118" cy="98" r="1.5" fill="#DB2777" />
        <Circle cx="121" cy="96" r="1.5" fill="#DB2777" />

        {/* Brazo derecho abierto */}
        <Path
          d="M180 94 C192 90, 198 94, 196 98 C192 101, 182 99, 180 96 Z"
          fill="#F472B6"
        />
        <Circle cx="196" cy="95" r="1.5" fill="#DB2777" />
        <Circle cx="193" cy="97" r="1.5" fill="#DB2777" />

        {/* Ojos */}
        <Circle cx="147" cy="88" r="2.2" fill="#1F232E" />
        <Circle cx="163" cy="86" r="2.2" fill="#1F232E" />

        {/* Boquita neutra / tierna */}
        <Path
          d="M153 92 L158 92"
          stroke="#1F232E"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
