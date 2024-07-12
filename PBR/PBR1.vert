#version 100

attribute highp vec3 position, normal;
attribute highp vec2 multitexcoord;
attribute highp vec4 color;
uniform highp mat4 projection, model, view;


varying highp vec2 Vertex_UV;
varying highp vec4 Vertex_Color;
varying highp vec3 Vertex_Normal;
varying highp vec4 Vertex_Position;
varying highp vec3 Vertex_Surface_to_Viewer_Direction;

// ----------------------------------------------------------------------------

highp mat4 InverseMatrix( mat4 A ) {

	highp float s0 = A[0][0] * A[1][1] - A[1][0] * A[0][1];
	highp float s1 = A[0][0] * A[1][2] - A[1][0] * A[0][2];
	highp float s2 = A[0][0] * A[1][3] - A[1][0] * A[0][3];
	highp float s3 = A[0][1] * A[1][2] - A[1][1] * A[0][2];
	highp float s4 = A[0][1] * A[1][3] - A[1][1] * A[0][3];
	highp float s5 = A[0][2] * A[1][3] - A[1][2] * A[0][3];
		     
	highp float c5 = A[2][2] * A[3][3] - A[3][2] * A[2][3];
	highp float c4 = A[2][1] * A[3][3] - A[3][1] * A[2][3];
	highp float c3 = A[2][1] * A[3][2] - A[3][1] * A[2][2];
	highp float c2 = A[2][0] * A[3][3] - A[3][0] * A[2][3];
	highp float c1 = A[2][0] * A[3][2] - A[3][0] * A[2][2];
	highp float c0 = A[2][0] * A[3][1] - A[3][0] * A[2][1];
		     
	highp float invdet = 1.0 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);
		     
	highp mat4 B;
		     
	B[0][0] = ( A[1][1] * c5 - A[1][2] * c4 + A[1][3] * c3) * invdet;
	B[0][1] = (-A[0][1] * c5 + A[0][2] * c4 - A[0][3] * c3) * invdet;
	B[0][2] = ( A[3][1] * s5 - A[3][2] * s4 + A[3][3] * s3) * invdet;
	B[0][3] = (-A[2][1] * s5 + A[2][2] * s4 - A[2][3] * s3) * invdet;
		     
	B[1][0] = (-A[1][0] * c5 + A[1][2] * c2 - A[1][3] * c1) * invdet;
	B[1][1] = ( A[0][0] * c5 - A[0][2] * c2 + A[0][3] * c1) * invdet;
	B[1][2] = (-A[3][0] * s5 + A[3][2] * s2 - A[3][3] * s1) * invdet;
	B[1][3] = ( A[2][0] * s5 - A[2][2] * s2 + A[2][3] * s1) * invdet;
		     
	B[2][0] = ( A[1][0] * c4 - A[1][1] * c2 + A[1][3] * c0) * invdet;
	B[2][1] = (-A[0][0] * c4 + A[0][1] * c2 - A[0][3] * c0) * invdet;
	B[2][2] = ( A[3][0] * s4 - A[3][1] * s2 + A[3][3] * s0) * invdet;
	B[2][3] = (-A[2][0] * s4 + A[2][1] * s2 - A[2][3] * s0) * invdet;
		     
	B[3][0] = (-A[1][0] * c3 + A[1][1] * c1 - A[1][2] * c0) * invdet;
	B[3][1] = ( A[0][0] * c3 - A[0][1] * c1 + A[0][2] * c0) * invdet;
	B[3][2] = (-A[3][0] * s3 + A[3][1] * s1 - A[3][2] * s0) * invdet;
	B[3][3] = ( A[2][0] * s3 - A[2][1] * s1 + A[2][2] * s0) * invdet;
		     
	return B;
}

highp mat4 transpose(in highp mat4 inMatrix) {
    highp vec4 i0 = inMatrix[0];
    highp vec4 i1 = inMatrix[1];
    highp vec4 i2 = inMatrix[2];
    highp vec4 i3 = inMatrix[3];

    highp mat4 outMatrix = mat4(
                 vec4(i0.x, i1.x, i2.x, i3.x),
                 vec4(i0.y, i1.y, i2.y, i3.y),
                 vec4(i0.z, i1.z, i2.z, i3.z),
                 vec4(i0.w, i1.w, i2.w, i3.w)
                 );

    return outMatrix;
}

void main()
{
	Vertex_UV = multitexcoord;
	Vertex_Color = color;
	lowp vec3 pos_eye=normalize(vec3(view * model * vec4(position, 1.0)));
	lowp vec3 norm_eye=normalize(vec3(view * model * vec4(normal, 0.0)));
	//Vertex_Normal = vec3(vec4(reflect( pos_eye, norm_eye),0.0)*view);
	Vertex_Normal = normalize(vec3(transpose(InverseMatrix(view*model)) * vec4(normal,1.0)));
	Vertex_Position = view * model * vec4(position,1.0);
	
	lowp vec3 vViewModelPosition = vec3(InverseMatrix(view*model) * vec4(0, 0, 0, 1.0));
	lowp vec3 vLocalSurfaceToViewerDirection = normalize(vViewModelPosition-position.xyz);
	vec3 vvLocalSurfaceNormal = normalize(normal);
	
	Vertex_Surface_to_Viewer_Direction = normalize(reflect(vLocalSurfaceToViewerDirection, vvLocalSurfaceNormal)) ;
	
	gl_Position = projection * view * model * vec4(position,1.0);
}
