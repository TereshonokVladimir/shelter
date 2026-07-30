import { RoomClient } from '@/features/room/components/room-client'
import { normalizeRoomCode } from '@/features/game/utils/game-logic'

interface RoomPageProps {
  params: Promise<{ code: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code: rawCode } = await params
  const code = normalizeRoomCode(rawCode)
  return <RoomClient code={code} />
}
