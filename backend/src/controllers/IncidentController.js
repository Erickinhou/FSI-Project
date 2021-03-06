const connection = require('../database/connection');

module.exports = {
  async index(request, response) {
    const { page = 1 } = request.query;

    const [count] = await connection('incidents').count();

    const incidents = await connection('incidents')
    .join('users', 'users.id', '=', 'incidents.user_id')
    .limit(5)
    .offset((page - 1) * 5)
    .select([
      'incidents.*', 
      'users.name', 
      'users.email', 
      'users.whatsapp', 
      'users.city', 
      'users.uf'
    ]);

    response.header('X-Total-Count', count['count(*)']);

    return response.json(incidents);
  },

   async create(request, response) {
     const { title, description } = request.body;
     const dataUser = response.getHeader('x-access');
    
     const user_id = dataUser.sub.id;

     const [id] = await connection('incidents').insert({
        title,
        description,
        user_id,
     });

     return response.json({ id });
   },
 
   async delete(request, response) {
     const { id } = request.params;
     const dataUser = response.getHeader('x-access');
    
     const user = dataUser.sub;

     const incident = await connection('incidents')
      .where('id', id)
      .select('user_id')
      .first();
    
    if(incident.user_id != user.id) 
      return response.status(401).json({ error: 'Operation not permitted.' });
      
    await connection('incidents').where('id', id).delete();

    return response.status(204).send();
   }
 };