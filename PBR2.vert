#version 300 es

in highp vec3 position, normal;
in highp vec2 multitexcoord;
in highp vec4 color;
uniform highp mat4 projection, model, view;


out highp vec2 Vertex_UV;
out highp vec4 Vertex_Color;
out highp vec3 Vertex_Normal;
out highp vec4 Vertex_Position;
out highp vec3 Vertex_Surface_to_Viewer_Direction;

// ----------------------------------------------------------------------------


void main()
{
	Vertex_UV = multitexcoord;
	Vertex_Color = color;
	lowp vec3 pos_eye=normalize(vec3(view * model * vec4(position, 1.0)));
	lowp vec3 norm_eye=normalize(vec3(view * model * vec4(normal, 0.0)));
	//Vertex_Normal = vec3(vec4(reflect( pos_eye, norm_eye),0.0)*view);
	Vertex_Normal = normalize(vec3(transpose(inverse(view*model)) * vec4(normal,1.0)));
	Vertex_Position = view * model * vec4(position,1.0);
	
	lowp vec3 vViewModelPosition = vec3(inverse(view*model) * vec4(0, 0, 0, 1.0));
	lowp vec3 vLocalSurfaceToViewerDirection = normalize(vViewModelPosition-position.xyz);
	vec3 vvLocalSurfaceNormal = normalize(normal);
	
	Vertex_Surface_to_Viewer_Direction = normalize(reflect(vLocalSurfaceToViewerDirection, vvLocalSurfaceNormal)) ;
	
	gl_Position = projection * view * model * vec4(position,1.0);
}
