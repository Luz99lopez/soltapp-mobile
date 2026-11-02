import { meetupOrderService } from '../src/services/meetupOrderService';
import { MeetupOrder } from '../src/types/order.types';

async function testReviewFlow() {
  console.log('=== TEST: FLUJO DE VALORACIÓN COMPRADOR -> VENDEDOR ===');

  const orderId = 'order-test-motorola-' + Date.now().toString(36);
  const sellerId = '122230dc-4ee3-407a-a32d-07a538b32212'; // yassvica
  const buyerId = 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb'; // kikesanabria14

  // 1. Crear orden simulada en DELIVERED
  const testOrder: MeetupOrder = {
    id: orderId,
    buyer_id: buyerId,
    seller_id: sellerId,
    status: 'DELIVERED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: {
      id: 'prod-moto-1',
      title: 'Celular Motorola G54',
      price: '$ 150.000',
      condition: 'Como nuevo',
      images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80'],
    },
    seller: {
      id: sellerId,
      full_name: 'yassvica',
    },
    buyer: {
      id: buyerId,
      full_name: 'Kike Sanabria',
    },
  };

  await meetupOrderService.saveLocalOrder(testOrder, false);
  console.log('1. Orden guardada en estado DELIVERED:', testOrder.id);

  // 2. Comprador envía calificación (5 estrellas + comentario)
  console.log('2. Comprador enviando calificación de 5 estrellas...');
  const reviewResult = await meetupOrderService.submitOrderReview(
    orderId,
    5,
    '¡Excelente celular! El equipo funciona impecable y el vendedor fue muy puntual.',
    'buyer'
  );
  console.log('   Resultado de submitOrderReview:', reviewResult);

  // 3. Verificar estado de la orden actualizada
  const updatedOrder = await meetupOrderService.getOrderById(orderId);
  console.log('3. Orden actualizada:');
  console.log('   - Estado:', updatedOrder?.status, '(esperado: COMPLETED)');
  console.log('   - buyer_reviewed:', updatedOrder?.buyer_reviewed, '(esperado: true)');
  console.log('   - buyer_rating:', updatedOrder?.buyer_rating, '(esperado: 5)');
  console.log('   - buyer_comment:', updatedOrder?.buyer_comment);

  // 4. Verificar reseñas del vendedor (yassvica)
  const sellerReviews = await meetupOrderService.getUserReviews(sellerId);
  console.log('4. Reseñas recuperadas para el vendedor (yassvica):');
  console.log('   - Cantidad de reseñas:', sellerReviews.length);
  const matchedReview = sellerReviews.find((r) => r.order_id === orderId);
  console.log('   - Reseña encontrada:', matchedReview ? {
    id: matchedReview.id,
    reviewer_name: matchedReview.reviewer_name,
    rating: matchedReview.rating,
    comment: matchedReview.comment,
    product_title: matchedReview.product_title,
  } : 'NO ENCONTRADA');

  // 5. Verificar notificación para el vendedor
  const notifs = await meetupOrderService.getNotifications(sellerId);
  const reviewNotif = notifs.find((n) => n.title.includes('valoración'));
  console.log('5. Notificación generada para el vendedor:');
  console.log('   - Notificación recibida:', reviewNotif ? {
    title: reviewNotif.title,
    message: reviewNotif.message,
    recipient_role: reviewNotif.recipient_role,
  } : 'NO ENCONTRADA');

  if (updatedOrder?.status === 'COMPLETED' && matchedReview && reviewNotif) {
    console.log('\n>>> ¡TODOS LOS TESTS DE VALORACIÓN PASARON CON ÉXITO! <<<');
  } else {
    console.error('\n>>> ERROR EN LOS TESTS DE VALORACIÓN <<<');
    process.exit(1);
  }
}

testReviewFlow().catch(console.error);
